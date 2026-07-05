import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { generateTicketNumber } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();

  // Build payload
  const monthKey = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric"
  });

  const supabase = createClient();

  // Lookup caller's engineer record
  const { data: engineer } = await supabase
    .from("engineers")
    .select("id,name,email")
    .eq("email", user.email)
    .eq("active", true)
    .maybeSingle();

  if (!engineer) {
    return NextResponse.json(
      { error: "Your account is not registered as an engineer." },
      { status: 403 }
    );
  }

  // Generate ticket number
  let ticketNumber: string;
  try {
    ticketNumber = await generateTicketNumber(supabase, monthKey);
  } catch {
    ticketNumber = `TIC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  }

  const status = (form.get("status") as string) || "Open";
  const priority = (form.get("priority") as string) || "Medium";

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      ticket_number: ticketNumber,
      month_key: monthKey,
      staff_pin: (form.get("staff_pin") as string) || null,
      staff_name: (form.get("staff_name") as string) || null,
      designation: (form.get("designation") as string) || null,
      project: (form.get("project") as string) || null,
      contact: (form.get("contact") as string) || null,
      staff_email: (form.get("staff_email") as string) || null,
      mrc_receive: (form.get("mrc_receive") as string) || null,
      assignee_email: (form.get("assignee_email") as string) || null,
      anydesk: (form.get("anydesk") as string) || null,
      problem_description: (form.get("problem_description") as string) || null,
      printer_ip: (form.get("printer_ip") as string) || null,
      extension: (form.get("extension") as string) || null,
      floor_dept: (form.get("floor_dept") as string) || null,
      call_type: (form.get("call_type") as string) || null,
      status,
      priority,
      created_by: user.email!,
      done_at: status === "Done" ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error || !ticket) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create ticket." },
      { status: 500 }
    );
  }

  // Handle attachments (admin client required to bypass RLS object policies).
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const files = form.getAll("attachments") as File[];
  const uploaded: { path: string; name: string; type: string; size: number }[] = [];

  for (const file of files) {
    if (!file || typeof file === "string") continue;
    if (file.size === 0) continue;
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: `File "${file.name}" exceeds 10 MB.` },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `tickets/${ticket.id}/${Date.now()}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: upErr } = await admin.storage
      .from("ticket-attachments")
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      });

    if (upErr) {
      return NextResponse.json(
        { error: `Upload failed for "${file.name}": ${upErr.message}` },
        { status: 500 }
      );
    }

    uploaded.push({
      path,
      name: file.name,
      type: file.type,
      size: file.size
    });
  }

  if (uploaded.length > 0) {
    const rows = uploaded.map((u) => ({
      ticket_id: ticket.id,
      file_path: u.path,
      file_name: u.name,
      file_type: u.type,
      size_bytes: u.size,
      uploaded_by: user.email
    }));
    const { error: aErr } = await supabase.from("ticket_attachments").insert(rows);
    if (aErr) {
      return NextResponse.json(
        { error: `Ticket created but attachment record failed: ${aErr.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true, ticket });
}

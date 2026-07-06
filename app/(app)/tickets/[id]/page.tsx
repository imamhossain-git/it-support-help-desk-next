import { notFound } from "next/navigation";
import Link from "next/link";
import { requireEngineer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { TicketDetail } from "@/components/ticket-detail";
import type { Engineer, Ticket, TicketAttachment, TicketActivity } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  await requireEngineer();
  const { id } = await params;

  const supabase = createClient();
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const [{ data: ticket }, { data: attachments }, { data: engineers }, { data: activity }] =
    await Promise.all([
      supabase.from("tickets").select("*").eq("id", id).maybeSingle(),
      supabase.from("ticket_attachments").select("*").eq("ticket_id", id),
      supabase.from("engineers").select("*").eq("active", true).order("name"),
      supabase.from("ticket_activity").select("*").eq("ticket_id", id).order("created_at", { ascending: false }).limit(50)
    ]);

  if (!ticket) notFound();

  // Generate signed URLs for attachments (private bucket).
  const attachmentsWithUrls: (TicketAttachment & { signedUrl: string | null })[] = [];
  for (const a of (attachments ?? []) as TicketAttachment[]) {
    const { data: signed } = await admin.storage
      .from("ticket-attachments")
      .createSignedUrl(a.file_path, 60 * 10); // 10 min
    attachmentsWithUrls.push({ ...a, signedUrl: signed?.signedUrl ?? null });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/tickets" className="text-sm" style={{ color: "var(--accent)" }}>
          ← Back to tickets
        </Link>
        <span className="muted text-xs">Created {new Date(ticket.created_at).toLocaleString()}</span>
      </div>

      <TicketDetail
        ticket={ticket as Ticket}
        attachments={attachmentsWithUrls}
        engineers={(engineers ?? []) as Engineer[]}
        activity={(activity ?? []) as TicketActivity[]}
      />
    </div>
  );
}

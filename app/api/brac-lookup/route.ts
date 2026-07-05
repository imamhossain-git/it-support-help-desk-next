import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchStaffInfo } from "@/lib/brac";

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let pin: string | null = null;
  try {
    const body = await request.json();
    pin = typeof body?.pin === "string" ? body.pin : null;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!pin) {
    return NextResponse.json({ error: "PIN is required." }, { status: 400 });
  }

  try {
    const staff = await fetchStaffInfo(pin);
    if (!staff) {
      return NextResponse.json(
        { error: "No staff found with that PIN." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, staff });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lookup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

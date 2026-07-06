import { requireEngineer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RosterCalendar } from "@/components/roster-calendar";

export default async function RosterPage() {
  const engineer = await requireEngineer();
  const supabase = createClient();

  const [{ data: roster }, { data: engineers }] = await Promise.all([
    supabase.from("roster").select("*"),
    supabase.from("engineers").select("id,name,email,active").eq("active", true).order("name")
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Duty Roster</h1>
        <p className="muted text-sm mt-1">
          {engineer.role === "admin"
            ? "Click any day to assign duty / MRC engineer."
            : "Monthly duty / MRC schedule (view only)."}
        </p>
      </header>

      <RosterCalendar
        isAdmin={engineer.role === "admin"}
        initialRoster={(roster ?? []) as { id: string; date: string; duty_email: string | null; mrc_email: string | null; note: string | null }[]}
        engineers={(engineers ?? []).map((e) => ({ name: e.name, email: e.email }))}
      />
    </div>
  );
}

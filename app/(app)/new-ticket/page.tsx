import { requireEngineer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewTicketForm } from "@/components/new-ticket-form";

export default async function NewTicketPage() {
  await requireEngineer();
  const supabase = createClient();

  const [{ data: engineers }, { data: floors }] = await Promise.all([
    supabase.from("engineers").select("id,name,email,active").eq("active", true).order("name"),
    supabase.from("floors").select("name").order("name")
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">New Ticket</h1>
        <p className="muted text-sm mt-1">
          Look up the staff member by PIN, then fill in the issue details.
        </p>
      </header>

      <NewTicketForm
        engineers={(engineers ?? []).map((e) => ({ email: e.email, name: e.name }))}
        floors={(floors ?? []).map((f) => f.name)}
      />
    </div>
  );
}

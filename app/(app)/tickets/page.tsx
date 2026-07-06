import { requireEngineer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TicketsTable } from "@/components/tickets-table";
import type { Ticket } from "@/types";

interface PageProps {
  searchParams: Promise<{ month?: string; status?: string; q?: string; assignee?: string }>;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const engineer = await requireEngineer();
  const params = await searchParams;
  const supabase = createClient();

  const monthKey =
    params.month ??
    new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  let query = supabase
    .from("tickets")
    .select("id, ticket_number, staff_name, staff_pin, floor_dept, status, priority, assignee_email, problem_description, created_at")
    .eq("month_key", monthKey)
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.status && params.status !== "All") {
    query = query.eq("status", params.status);
  }
  if (params.assignee === "me") {
    query = query.eq("assignee_email", engineer.email);
  }
  if (params.q) {
    const q = `%${params.q}%`;
    query = query.or(
      `ticket_number.ilike.${q},staff_name.ilike.${q},problem_description.ilike.${q},staff_pin.ilike.${q}`
    );
  }

  const [{ data: tickets }, { data: monthsRows }, { data: engineers }] = await Promise.all([
    query,
    supabase.from("tickets").select("month_key").order("month_key", { ascending: false }).limit(500),
    supabase.from("engineers").select("name,email").eq("active", true)
  ]);

  const uniqueMonths = Array.from(new Set((monthsRows ?? []).map((m) => m.month_key)));

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <header>
        <h1 className="text-2xl font-bold">All Tickets</h1>
        <p className="muted text-sm mt-1">Search, filter and update across months.</p>
      </header>

      <TicketsTable
        tickets={(tickets ?? []) as Ticket[]}
        engineers={(engineers ?? []) as { name: string; email: string }[]}
        months={uniqueMonths}
        currentMonth={monthKey}
        currentStatus={params.status ?? "All"}
        currentQuery={params.q ?? ""}
        onlyMine={params.assignee === "me"}
      />
    </div>
  );
}

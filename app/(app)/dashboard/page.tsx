import Link from "next/link";
import { requireEngineer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TicketStats } from "@/components/ticket-stats";
import { RecentTickets } from "@/components/recent-tickets";
import type { Ticket, Engineer, TicketStatus } from "@/types";

export default async function DashboardPage() {
  const engineer = await requireEngineer();
  const supabase = createClient();

  const monthKey = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric"
  });

  const [{ data: ticketsData }, { data: engineersData }, { count: allTime }] =
    await Promise.all([
      supabase
        .from("tickets")
        .select("*")
        .eq("month_key", monthKey)
        .order("created_at", { ascending: false }),
      supabase.from("engineers").select("*").eq("active", true),
      supabase.from("tickets").select("id", { count: "exact", head: true })
    ]);

  const tickets = (ticketsData as Ticket[]) ?? [];
  const engineers = (engineersData as Engineer[]) ?? [];

  const statusCounts: Record<TicketStatus, number> = {
    Open: 0,
    "In Progress": 0,
    Done: 0,
    "On Hold": 0,
    Cancelled: 0
  };
  tickets.forEach((t) => {
    statusCounts[t.status as TicketStatus] =
      (statusCounts[t.status as TicketStatus] ?? 0) + 1;
  });

  const recent = tickets.slice(0, 8);
  const myAssigned = tickets.filter(
    (t) => t.assignee_email === engineer.email && t.status !== "Done"
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="muted text-sm mt-1">
            Welcome back, <strong>{engineer.name}</strong>. Showing tickets for{" "}
            <strong>{monthKey}</strong>.
          </p>
        </div>
        <Link href="/new-ticket" className="btn btn-primary">
          ➕ New Ticket
        </Link>
      </header>

      <TicketStats
        total={tickets.length}
        allTime={allTime ?? 0}
        statusCounts={statusCounts}
      />

      {myAssigned.length > 0 && (
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">My Assigned Tickets ({myAssigned.length})</h2>
            <Link href="/tickets?assignee=me" className="text-sm" style={{ color: "var(--accent)" }}>
              View all →
            </Link>
          </div>
          <RecentTickets tickets={myAssigned.slice(0, 5)} engineers={engineers} />
        </section>
      )}

      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Recent Tickets</h2>
          <Link href="/tickets" className="text-sm" style={{ color: "var(--accent)" }}>
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="muted text-sm py-8 text-center">
            No tickets yet for this month.{" "}
            <Link href="/new-ticket" style={{ color: "var(--accent)" }}>
              Create the first one →
            </Link>
          </p>
        ) : (
          <RecentTickets tickets={recent} engineers={engineers} />
        )}
      </section>
    </div>
  );
}

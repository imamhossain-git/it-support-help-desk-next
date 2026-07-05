import type { TicketStatus } from "@/types";

interface Props {
  total: number;
  allTime: number;
  statusCounts: Record<TicketStatus, number>;
}

const cards: { key: TicketStatus; label: string; color: string }[] = [
  { key: "Open", label: "Open", color: "var(--warning)" },
  { key: "In Progress", label: "In Progress", color: "#2563eb" },
  { key: "Done", label: "Done", color: "var(--success)" },
  { key: "On Hold", label: "On Hold", color: "var(--text-muted)" }
];

export function TicketStats({ total, allTime, statusCounts }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div className="card">
        <div className="text-xs muted uppercase tracking-wider">This Month</div>
        <div className="text-3xl font-bold mt-1">{total}</div>
      </div>
      <div className="card">
        <div className="text-xs muted uppercase tracking-wider">All Time</div>
        <div className="text-3xl font-bold mt-1">{allTime}</div>
      </div>
      {cards.map((c) => (
        <div key={c.key} className="card">
          <div className="text-xs muted uppercase tracking-wider">{c.label}</div>
          <div className="text-3xl font-bold mt-1" style={{ color: c.color }}>
            {statusCounts[c.key] ?? 0}
          </div>
        </div>
      ))}
    </div>
  );
}

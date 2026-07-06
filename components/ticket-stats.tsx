import type { TicketStatus } from "@/types";

interface Props {
  total: number;
  allTime: number;
  openMine: number;
  statusCounts: Record<TicketStatus, number>;
}

const cards: { key: TicketStatus; label: string; color: string }[] = [
  { key: "Open", label: "Open", color: "var(--warning)" },
  { key: "In Progress", label: "In Progress", color: "#2563eb" },
  { key: "Done", label: "Done", color: "var(--success)" },
  { key: "On Hold", label: "On Hold", color: "var(--text-muted)" }
];

export function TicketStats({ total, allTime, openMine, statusCounts }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 stagger">
      <Stat label="This Month" value={total} accent="var(--accent)" />
      <Stat label="All Time" value={allTime} accent="var(--accent)" />
      <Stat label="Open (Mine)" value={openMine} accent="var(--warning)" highlight />
      {cards.map((c) => (
        <Stat key={c.key} label={c.label} value={statusCounts[c.key] ?? 0} accent={c.color} />
      ))}
    </div>
  );
}

function Stat({ label, value, accent, highlight }: { label: string; value: number; accent: string; highlight?: boolean }) {
  return (
    <div
      className="card card-hover"
      style={highlight ? { background: "var(--accent-soft)", borderColor: "var(--accent-tint)" } : undefined}
    >
      <div className="text-xs muted uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-3xl font-bold mt-1.5" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

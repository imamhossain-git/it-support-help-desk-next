"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import type { Ticket, TicketStatus, Engineer } from "@/types";

interface Props {
  tickets: Ticket[];
  engineers: Pick<Engineer, "email" | "name">[];
  months: string[];
  currentMonth: string;
  currentStatus: string;
  currentQuery: string;
  onlyMine: boolean;
}

const STATUSES: TicketStatus[] = ["Open", "In Progress", "On Hold", "Done", "Cancelled"];

function badgeClass(status: string) {
  switch (status) {
    case "Open": return "badge badge-open";
    case "In Progress": return "badge badge-progress";
    case "Done": return "badge badge-done";
    case "On Hold": return "badge badge-hold";
    case "Cancelled": return "badge badge-cancel";
    default: return "badge";
  }
}

export function TicketsTable({
  tickets,
  engineers,
  months,
  currentMonth,
  currentStatus,
  currentQuery,
  onlyMine
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(currentQuery);
  const [month, setMonth] = useState(currentMonth);
  const [status, setStatus] = useState(currentStatus);
  const [mine, setMine] = useState(onlyMine);
  const [busyId, setBusyId] = useState<string | null>(null);

  const engineerMap = new Map(engineers.map((e) => [e.email, e.name]));

  function push(filters: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== "All" && v !== "") sp.set(k, v);
    });
    router.push(`/tickets?${sp.toString()}`);
  }

  function applyFilters() {
    push({
      month: month === "All" ? undefined : month,
      status: status === "All" ? undefined : status,
      q: q || undefined,
      assignee: mine ? "me" : undefined
    });
  }

  function clearFilters() {
    setQ("");
    setStatus("All");
    setMine(false);
    router.push("/tickets");
  }

  async function changeStatus(id: string, newStatus: TicketStatus) {
    setBusyId(id);
    const supabase = createClient();
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "Done") updates.done_at = new Date().toISOString();

    const { error } = await supabase.from("tickets").update(updates).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Status → ${newStatus}`);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label>Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ticket #, staff name, PIN, problem…"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>
        <div>
          <label>Month</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option>All</option>
            {months.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm" style={{ marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => setMine(e.target.checked)}
            style={{ width: "auto" }}
          />
          My tickets only
        </label>
        <div className="flex gap-2">
          <button onClick={applyFilters} className="btn btn-primary">Apply</button>
          <button onClick={clearFilters} className="btn btn-secondary">Clear</button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        {tickets.length === 0 ? (
          <p className="muted text-sm py-10 text-center">No tickets match your filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Staff</th>
                <th>Floor</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="font-semibold">{t.ticket_number}</div>
                    <div className="text-xs muted truncate max-w-[200px]">
                      {t.problem_description || "—"}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium">{t.staff_name ?? "—"}</div>
                    <div className="text-xs muted">{t.staff_pin ?? ""}</div>
                  </td>
                  <td className="text-sm">{t.floor_dept ?? "—"}</td>
                  <td className="text-sm">{t.priority}</td>
                  <td>
                    <select
                      value={t.status}
                      onChange={(e) => changeStatus(t.id, e.target.value as TicketStatus)}
                      disabled={busyId === t.id}
                      style={{ padding: "4px 8px", fontSize: 12 }}
                    >
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <div className="mt-1">
                      <span className={badgeClass(t.status)}>{t.status}</span>
                    </div>
                  </td>
                  <td className="text-sm">
                    {t.assignee_email
                      ? engineerMap.get(t.assignee_email) ?? t.assignee_email
                      : <span className="muted">Unassigned</span>}
                  </td>
                  <td className="text-xs muted">{formatDateTime(t.created_at)}</td>
                  <td>
                    <Link
                      href={`/tickets/${t.id}`}
                      className="text-sm font-semibold"
                      style={{ color: "var(--accent)" }}
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs muted text-center">{tickets.length} ticket(s)</p>
    </div>
  );
}

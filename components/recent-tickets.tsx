import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import type { Engineer, Ticket } from "@/types";

interface Props {
  tickets: Ticket[];
  engineers: Engineer[];
}

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

export function RecentTickets({ tickets, engineers }: Props) {
  const engineerMap = new Map(engineers.map((e) => [e.email, e.name]));

  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Staff</th>
            <th>Floor</th>
            <th>Status</th>
            <th>Assigned</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>
                <div className="font-semibold">{t.ticket_number}</div>
                <div className="text-xs muted truncate max-w-[180px]">
                  {t.problem_description || "—"}
                </div>
              </td>
              <td>
                <div className="font-medium">{t.staff_name ?? "—"}</div>
                <div className="text-xs muted">{t.staff_pin ?? ""}</div>
              </td>
              <td className="text-sm">{t.floor_dept ?? "—"}</td>
              <td>
                <span className={badgeClass(t.status)}>{t.status}</span>
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
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

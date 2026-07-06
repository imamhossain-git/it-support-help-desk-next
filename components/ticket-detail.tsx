"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import type {
  Engineer,
  Ticket,
  TicketActivity,
  TicketAttachment,
  TicketStatus
} from "@/types";

interface AttachmentWithUrl extends TicketAttachment {
  signedUrl: string | null;
}

interface Props {
  ticket: Ticket;
  attachments: AttachmentWithUrl[];
  engineers: Engineer[];
  activity: TicketActivity[];
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

function activityIcon(action: string): string {
  switch (action) {
    case "status_changed": return "🔄";
    case "assigned": return "👤";
    case "created": return "✨";
    default: return "📝";
  }
}

function activityText(a: TicketActivity): string {
  switch (a.action) {
    case "status_changed": return `changed status ${a.old_value ?? "?"} → ${a.new_value ?? "?"}`;
    case "assigned": return `assigned ${a.old_value ?? "unassigned"} → ${a.new_value ?? "?"}`;
    case "created": return "created the ticket";
    default: return a.note ?? a.action;
  }
}

export function TicketDetail({ ticket, attachments, engineers, activity: initialActivity }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [assignee, setAssignee] = useState(ticket.assignee_email ?? "");
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState<TicketActivity[]>(initialActivity);

  const engineerMap = new Map(engineers.map((e) => [e.email, e]));

  // Subscribe to live activity updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_activity",
          filter: `ticket_id=eq.${ticket.id}`
        },
        (payload) => {
          const a = payload.new as TicketActivity;
          setActivity((prev) => {
            if (prev.some((p) => p.id === a.id)) return prev;
            return [a, ...prev];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id]);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const updates: Record<string, unknown> = {};
    if (status !== ticket.status) {
      updates.status = status;
      updates.done_at = status === "Done" ? new Date().toISOString() : null;
    }
    if (assignee !== (ticket.assignee_email ?? "")) {
      updates.assignee_email = assignee || null;
    }
    if (Object.keys(updates).length === 0) {
      setSaving(false);
      return toast.info("Nothing to save.");
    }
    const { error } = await supabase.from("tickets").update(updates).eq("id", ticket.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Ticket updated.");
    router.refresh();
  }

  function fmtBytes(b: number | null) {
    if (!b) return "";
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Main column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <div className="text-xs muted">{ticket.ticket_number}</div>
              <h1 className="text-2xl font-bold mt-1">{ticket.staff_name ?? "—"}</h1>
              <p className="muted text-sm">{ticket.designation} · {ticket.project}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={badgeClass(ticket.status)}>{ticket.status}</span>
              <span
                className="badge"
                style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}
              >
                {ticket.priority}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <Field label="PIN" value={ticket.staff_pin} />
            <Field label="Contact" value={ticket.contact} />
            <Field label="Email" value={ticket.staff_email} />
            <Field label="Floor / Dept" value={ticket.floor_dept} />
            <Field label="Call Type" value={ticket.call_type} />
            <Field label="MRC Receive" value={ticket.mrc_receive} />
            <Field label="AnyDesk" value={ticket.anydesk} />
            <Field label="Printer IP" value={ticket.printer_ip} />
            <Field label="Extension" value={ticket.extension} />
            <Field label="Created By" value={ticket.created_by} />
            <Field label="Created At" value={formatDateTime(ticket.created_at)} />
            <Field label="Done At" value={formatDateTime(ticket.done_at)} />
          </div>

          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="text-xs muted uppercase tracking-wider mb-2">Problem</div>
            <p className="text-sm whitespace-pre-wrap">
              {ticket.problem_description || <span className="muted">No description.</span>}
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold mb-3">Update</h2>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <div>
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Assign To</label>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">— Unassigned —</option>
                {engineers.map((e) => (
                  <option key={e.email} value={e.email}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

        {attachments.length > 0 && (
          <div className="card">
            <h2 className="font-bold mb-3">Attachments ({attachments.length})</h2>
            <ul className="space-y-2">
              {attachments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg border"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="text-sm min-w-0">
                    <div className="font-medium truncate">{a.file_name}</div>
                    <div className="text-xs muted">
                      {a.file_type || "file"} · {fmtBytes(a.size_bytes)}
                    </div>
                  </div>
                  {a.signedUrl ? (
                    <a
                      href={a.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary text-xs"
                      style={{ padding: "6px 10px" }}
                    >
                      Open
                    </a>
                  ) : (
                    <span className="muted text-xs">No URL</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Activity column */}
      <aside className="space-y-4">
        <div className="card">
          <h2 className="font-bold mb-3 flex items-center justify-between">
            <span>Activity</span>
            <span className="text-xs muted font-normal">{activity.length}</span>
          </h2>
          {activity.length === 0 ? (
            <p className="muted text-sm text-center py-4">No activity yet.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
              {activity.map((a) => (
                <div key={a.id} className="flex gap-2 text-sm">
                  <span className="text-lg">{activityIcon(a.action)}</span>
                  <div className="flex-1 min-w-0">
                    <div>
                      <strong>{a.actor_email.split("@")[0]}</strong>{" "}
                      <span className="muted">{activityText(a)}</span>
                    </div>
                    <div className="text-xs muted">{formatDateTime(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs muted">{label}</div>
      <div className="font-medium break-words">{value || <span className="muted">—</span>}</div>
    </div>
  );
}

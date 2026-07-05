"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BracStaff, TicketPriority, TicketStatus } from "@/types";

interface EngineerOption { email: string; name: string; }

interface Props {
  engineers: EngineerOption[];
  floors: string[];
}

const PRIORITIES: TicketPriority[] = ["Low", "Medium", "High", "Critical"];
const STATUSES: TicketStatus[] = ["Open", "In Progress", "On Hold", "Done"];
const CALL_TYPES = ["Phone", "Email", "Walk-in", "Remote", "AnyDesk"];

export function NewTicketForm({ engineers, floors }: Props) {
  const router = useRouter();

  // PIN lookup state
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [staff, setStaff] = useState<BracStaff | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  // Form state
  const [status, setStatus] = useState<TicketStatus>("Open");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [callType, setCallType] = useState(CALL_TYPES[0]);
  const [assignee, setAssignee] = useState("");
  const [floorDept, setFloorDept] = useState(floors[0] ?? "");
  const [problem, setProblem] = useState("");
  const [anydesk, setAnydesk] = useState("");
  const [printerIp, setPrinterIp] = useState("");
  const [extension, setExtension] = useState("");
  const [mrcReceive, setMrcReceive] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function lookupPin(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    setPinLoading(true);
    setPinError(null);
    setStaff(null);
    try {
      const res = await fetch("/api/brac-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Lookup failed");
      setStaff(data.staff as BracStaff);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lookup failed";
      setPinError(msg);
    } finally {
      setPinLoading(false);
    }
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (list.length > 5) {
      toast.error("Max 5 files.");
      return;
    }
    setFiles(list);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!staff) {
      toast.error("Please look up the staff by PIN first.");
      return;
    }
    if (!problem.trim()) {
      toast.error("Problem description is required.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("staff_pin", staff.pin);
      fd.append("staff_name", staff.fullName);
      fd.append("designation", staff.designation);
      fd.append("project", staff.project);
      fd.append("contact", staff.contact);
      fd.append("staff_email", staff.email);
      fd.append("mrc_receive", mrcReceive);
      fd.append("assignee_email", assignee);
      fd.append("anydesk", anydesk);
      fd.append("problem_description", problem);
      fd.append("printer_ip", printerIp);
      fd.append("extension", extension);
      fd.append("floor_dept", floorDept);
      fd.append("call_type", callType);
      fd.append("status", status);
      fd.append("priority", priority);
      files.forEach((f) => fd.append("attachments", f));

      const res = await fetch("/api/tickets", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Submit failed");

      toast.success(`Ticket ${data.ticket.ticket_number} created.`);
      router.push(`/tickets/${data.ticket.id}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submit failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* PIN Lookup */}
      <section className="card lg:col-span-2">
        <h2 className="font-bold mb-4">1. Staff Lookup</h2>
        <form onSubmit={lookupPin} className="flex gap-2 mb-4">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter BRAC staff PIN"
            inputMode="numeric"
            maxLength={10}
          />
          <button type="submit" disabled={pinLoading} className="btn btn-primary">
            {pinLoading ? "…" : "Search"}
          </button>
        </form>

        {pinError && (
          <p className="text-sm mb-3" style={{ color: "var(--danger)" }}>
            {pinError}
          </p>
        )}

        {staff ? (
          <div
            className="rounded-lg p-4 border"
            style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}
          >
            <Field label="Name" value={staff.fullName} />
            <Field label="Designation" value={staff.designation} />
            <Field label="Programme / Project" value={staff.project} />
            <Field label="Contact" value={staff.contact} />
            <Field label="Email" value={staff.email} />
          </div>
        ) : (
          <p className="muted text-sm py-6 text-center">
            Look up a staff member to pre-fill the ticket.
          </p>
        )}
      </section>

      {/* Ticket Form */}
      <form onSubmit={submit} className="card lg:col-span-3 space-y-4">
        <h2 className="font-bold">2. Ticket Details</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>Call Type</label>
            <select value={callType} onChange={(e) => setCallType(e.target.value)}>
              {CALL_TYPES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>Floor / Department</label>
            {floors.length > 0 ? (
              <select value={floorDept} onChange={(e) => setFloorDept(e.target.value)}>
                {floors.map((f) => <option key={f}>{f}</option>)}
              </select>
            ) : (
              <input
                value={floorDept}
                onChange={(e) => setFloorDept(e.target.value)}
                placeholder="e.g., Floor 5 – Finance"
              />
            )}
          </div>
        </div>

        <div>
          <label>Assign To</label>
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">— Unassigned —</option>
            {engineers.map((eng) => (
              <option key={eng.email} value={eng.email}>{eng.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Problem Description <span style={{ color: "var(--danger)" }}>*</span></label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={4}
            placeholder="Describe the issue…"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label>AnyDesk ID</label>
            <input value={anydesk} onChange={(e) => setAnydesk(e.target.value)} placeholder="123 456 789" />
          </div>
          <div>
            <label>Printer IP</label>
            <input value={printerIp} onChange={(e) => setPrinterIp(e.target.value)} placeholder="10.0.0.50" />
          </div>
          <div>
            <label>Extension</label>
            <input value={extension} onChange={(e) => setExtension(e.target.value)} placeholder="2401" />
          </div>
        </div>

        <div>
          <label>MRC Receive</label>
          <input
            value={mrcReceive}
            onChange={(e) => setMrcReceive(e.target.value)}
            placeholder="e.g., 2024-05-21 09:30"
          />
        </div>

        <div>
          <label>Attachments (optional, max 5, 10 MB each)</label>
          <input
            ref={fileRef}
            type="file"
            multiple
            onChange={onFiles}
            style={{ padding: 8 }}
          />
          {files.length > 0 && (
            <ul className="text-xs muted mt-2 space-y-1">
              {files.map((f) => (
                <li key={f.name}>
                  📎 {f.name} — {(f.size / 1024).toFixed(1)} KB
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={() => {
              setStaff(null);
              setPin("");
              setProblem("");
              setFiles([]);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !staff}
          >
            {submitting ? "Creating…" : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-sm py-1">
      <span className="muted">{label}</span>
      <span className={cn("font-medium text-right break-words", !value && "muted")}>
        {value || "—"}
      </span>
    </div>
  );
}

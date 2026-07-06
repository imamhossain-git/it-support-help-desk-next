"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface EngineerLite { name: string; email: string; }
interface RosterRow {
  id: string;
  date: string;
  duty_email: string | null;
  mrc_email: string | null;
  note: string | null;
}

interface Props {
  isAdmin: boolean;
  initialRoster: RosterRow[];
  engineers: EngineerLite[];
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function RosterCalendar({ isAdmin, initialRoster, engineers }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [roster, setRoster] = useState<RosterRow[]>(initialRoster);
  const [editing, setEditing] = useState<string | null>(null);
  const [duty, setDuty] = useState("");
  const [mrc, setMrc] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const rosterByDate = useMemo(() => {
    const map = new Map<string, RosterRow>();
    roster.forEach((r) => map.set(r.date, r));
    return map;
  }, [roster]);

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }

  function openEditor(dateKey: string) {
    if (!isAdmin) return;
    const r = rosterByDate.get(dateKey);
    setEditing(dateKey);
    setDuty(r?.duty_email ?? "");
    setMrc(r?.mrc_email ?? "");
    setNote(r?.note ?? "");
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        date: editing,
        duty_email: duty || null,
        mrc_email: mrc || null,
        note: note || null,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from("roster")
        .upsert(payload, { onConflict: "date" })
        .select()
        .single();
      if (error) throw error;
      setRoster((prev) => {
        const idx = prev.findIndex((r) => r.date === editing);
        if (idx === -1) return [...prev, data as RosterRow];
        const next = [...prev];
        next[idx] = data as RosterRow;
        return next;
      });
      toast.success("Roster saved.");
      setEditing(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const engineerMap = new Map(engineers.map((e) => [e.email, e.name]));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sun
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = toDateKey(new Date());

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header / month nav */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <button onClick={() => shift(-1)} className="btn btn-secondary" style={{ padding: "6px 12px" }}>
          ← Prev
        </button>
        <h2 className="text-lg font-bold">{monthLabel(year, month)}</h2>
        <button onClick={() => shift(1)} className="btn btn-secondary" style={{ padding: "6px 12px" }}>
          Next →
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold muted uppercase tracking-wider py-2 border-b" style={{ borderColor: "var(--border)" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) {
            return <div key={i} className="aspect-square border-t border-l" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }} />;
          }
          const key = toDateKey(d);
          const r = rosterByDate.get(key);
          const isToday = key === todayKey;
          const dutyName = r?.duty_email ? engineerMap.get(r.duty_email) ?? "—" : null;
          const mrcName = r?.mrc_email ? engineerMap.get(r.mrc_email) ?? "—" : null;

          return (
            <button
              key={i}
              onClick={() => openEditor(key)}
              disabled={!isAdmin}
              className={cn(
                "aspect-square border-t border-l p-1.5 text-left transition-colors flex flex-col gap-0.5",
                isAdmin && "hover:bg-[var(--surface-muted)] cursor-pointer",
                !isAdmin && "cursor-default"
              )}
              style={{ borderColor: "var(--border)" }}
            >
              <div className={cn("text-xs font-semibold", isToday && "px-1.5 py-0.5 rounded-full inline-block self-start", isToday && { background: "var(--accent)", color: "#fff" })}>
                {d.getDate()}
              </div>
              {dutyName && (
                <div className="text-[10px] font-semibold truncate" style={{ color: "var(--accent)" }}>
                  🛠 {dutyName}
                </div>
              )}
              {mrcName && (
                <div className="text-[10px] muted truncate">
                  📞 {mrcName}
                </div>
              )}
              {r?.note && (
                <div className="text-[10px] muted truncate">📝 {r.note}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Editor modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "var(--overlay-bg)" }}
          onClick={() => setEditing(null)}
        >
          <div
            className="card w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-1">Roster for {editing}</h3>
            <p className="muted text-xs mb-4">Assign duty and MRC engineer.</p>

            <div className="space-y-3">
              <div>
                <label>Duty Engineer</label>
                <select value={duty} onChange={(e) => setDuty(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {engineers.map((e) => (
                    <option key={e.email} value={e.email}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>MRC Engineer</label>
                <select value={mrc} onChange={(e) => setMrc(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {engineers.map((e) => (
                    <option key={e.email} value={e.email}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Note</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={save} disabled={saving} className="btn btn-primary">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

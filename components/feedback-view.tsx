"use client";

import { useMemo, useState } from "react";
import { cn, formatDateTime } from "@/lib/utils";

interface EngineerLite { name: string; email: string; }
interface FeedbackRow {
  id: string;
  ticket_number: string | null;
  staff_name: string | null;
  program: string | null;
  solved_by_email: string | null;
  satisfaction: string;
  score: number;
  comment: string | null;
  month_key: string;
  created_at: string;
}

interface Props {
  initialFeedback: FeedbackRow[];
  engineers: EngineerLite[];
  currentMonth?: string;
}

const SAT_FACES: Record<string, { emoji: string; color: string }> = {
  "Very Satisfactory": { emoji: "😍", color: "#10b981" },
  "Satisfactory": { emoji: "🙂", color: "#22c55e" },
  "Average": { emoji: "😐", color: "#f59e0b" },
  "Poor": { emoji: "🙁", color: "#ef4444" },
  "Very Poor": { emoji: "😡", color: "#dc2626" }
};

export function FeedbackView({ initialFeedback, engineers, currentMonth }: Props) {
  const engineerMap = useMemo(() => new Map(engineers.map((e) => [e.email, e.name])), [engineers]);

  const months = useMemo(() => {
    const set = new Set(initialFeedback.map((f) => f.month_key));
    return Array.from(set).sort().reverse();
  }, [initialFeedback]);

  const [month, setMonth] = useState<string>(currentMonth ?? "All");

  const filtered = useMemo(() => {
    if (month === "All") return initialFeedback;
    return initialFeedback.filter((f) => f.month_key === month);
  }, [initialFeedback, month]);

  // Aggregate per engineer
  const perEngineer = useMemo(() => {
    const map = new Map<string, { count: number; sum: number; recent: FeedbackRow[] }>();
    for (const f of filtered) {
      const key = f.solved_by_email ?? "unassigned";
      const e = map.get(key) ?? { count: 0, sum: 0, recent: [] };
      e.count += 1;
      e.sum += f.score;
      e.recent.push(f);
      map.set(key, e);
    }
    return Array.from(map.entries())
      .map(([email, v]) => ({
        email,
        name: engineerMap.get(email) ?? email,
        avg: v.sum / v.count,
        count: v.count,
        recent: v.recent.slice(0, 3)
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [filtered, engineerMap]);

  // Distribution
  const distribution = useMemo(() => {
    const dist: Record<string, number> = {};
    SAT_FACES_ORDER.forEach((s) => (dist[s] = 0));
    filtered.forEach((f) => {
      dist[f.satisfaction] = (dist[f.satisfaction] ?? 0) + 1;
    });
    return dist;
  }, [filtered]);

  const total = filtered.length;
  const overallAvg = total === 0 ? 0 : filtered.reduce((a, b) => a + b.score, 0) / total;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card flex items-center gap-3 flex-wrap">
        <div>
          <label>Month</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="All">All Time</option>
            {months.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="ml-auto text-sm muted">
          {total} feedback · average{" "}
          <strong style={{ color: "var(--text)" }}>{overallAvg.toFixed(2)} / 5</strong>
        </div>
      </div>

      {/* Engineer leaderboard */}
      <section className="card">
        <h2 className="font-bold mb-3">By Engineer</h2>
        {perEngineer.length === 0 ? (
          <p className="muted text-center text-sm py-8">No feedback yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {perEngineer.map((e) => (
              <div
                key={e.email}
                className="rounded-xl p-4 border"
                style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    {e.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{e.name}</div>
                    <div className="text-xs muted">{e.count} response{e.count === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
                    {e.avg.toFixed(1)}
                  </div>
                  <div className="text-xs muted mb-1">/ 5</div>
                </div>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        background: i < Math.round(e.avg) ? "var(--accent)" : "var(--border)"
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Distribution */}
      {total > 0 && (
        <section className="card">
          <h2 className="font-bold mb-3">Distribution</h2>
          <div className="space-y-2">
            {SAT_FACES_ORDER.map((s) => {
              const count = distribution[s] ?? 0;
              const pct = total === 0 ? 0 : (count / total) * 100;
              const face = SAT_FACES[s];
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-32 text-sm flex items-center gap-2">
                    <span style={{ fontSize: 18 }}>{face.emoji}</span>
                    <span>{s}</span>
                  </div>
                  <div className="flex-1 h-6 rounded overflow-hidden" style={{ background: "var(--surface-muted)" }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: face.color
                      }}
                    />
                  </div>
                  <div className="w-20 text-right text-sm muted">
                    {count} ({pct.toFixed(0)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent comments */}
      <section className="card">
        <h2 className="font-bold mb-3">Recent Comments</h2>
        {filtered.length === 0 ? (
          <p className="muted text-center text-sm py-8">No feedback yet.</p>
        ) : (
          <div className="space-y-3">
            {filtered.slice(0, 20).map((f) => {
              const face = SAT_FACES[f.satisfaction] ?? SAT_FACES["Average"];
              return (
                <div
                  key={f.id}
                  className="rounded-xl p-4 border"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 22 }}>{face.emoji}</span>
                      <div>
                        <div className="font-semibold text-sm">{f.satisfaction}</div>
                        <div className="text-xs muted">
                          {f.ticket_number} · {f.staff_name ?? "—"} · {f.month_key}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs muted">{formatDateTime(f.created_at)}</div>
                  </div>
                  {f.comment && (
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text)" }}>
                      {f.comment}
                    </p>
                  )}
                  <div className="text-xs muted mt-2">
                    Solved by <strong>{f.solved_by_email ?? "—"}</strong>
                    {f.program && <> · {f.program}</>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const SAT_FACES_ORDER = ["Very Satisfactory", "Satisfactory", "Average", "Poor", "Very Poor"];

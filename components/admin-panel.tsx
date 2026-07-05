"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Engineer, Floor, EngineerRole } from "@/types";

interface Props {
  initialEngineers: Engineer[];
  initialFloors: Floor[];
}

export function AdminPanel({ initialEngineers, initialFloors }: Props) {
  const [engineers, setEngineers] = useState<Engineer[]>(initialEngineers);
  const [floors, setFloors] = useState<Floor[]>(initialFloors);
  const [, startTransition] = useTransition();

  // Engineer form
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [eRole, setERole] = useState<EngineerRole>("engineer");
  const [busyE, setBusyE] = useState(false);

  // Floor form
  const [fName, setFName] = useState("");
  const [busyF, setBusyF] = useState(false);

  async function addEngineer(e: React.FormEvent) {
    e.preventDefault();
    if (!eName.trim() || !eEmail.trim()) return;
    setBusyE(true);
    try {
      const admin = createAdminClient();
      // Invite user so they appear in auth.users (without email body — we only need the row).
      // We instead create the row directly. The user can later sign in with Google if their
      // email matches.
      const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
        eEmail.trim().toLowerCase(),
        { data: { full_name: eName.trim() } }
      ).catch(() => ({ data: null, error: null }));

      let authUserId: string | null = invited?.user?.id ?? null;

      // If invite failed (e.g., not allowed) or returned no user, just insert the row anyway
      // and trust that login will populate auth.users later.
      if (!authUserId) {
        // Try to find existing auth user by email
        const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
        const found = list?.users?.find(
          (u) => u.email?.toLowerCase() === eEmail.trim().toLowerCase()
        );
        authUserId = found?.id ?? null;
      }

      const { data, error } = await admin
        .from("engineers")
        .insert({
          email: eEmail.trim().toLowerCase(),
          name: eName.trim(),
          role: eRole,
          active: true
        })
        .select()
        .single();

      if (error) throw error;
      setEngineers((prev) => [...prev, data as Engineer]);
      setEName("");
      setEEmail("");
      setERole("engineer");
      toast.success("Engineer added.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusyE(false);
    }
  }

  async function toggleEngineer(id: string, active: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("engineers")
      .update({ active: !active })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setEngineers((prev) =>
      prev.map((e) => (e.id === id ? { ...e, active: !active } : e))
    );
    toast.success(!active ? "Engineer reactivated." : "Engineer deactivated.");
  }

  async function changeRole(id: string, role: EngineerRole) {
    const supabase = createClient();
    const { error } = await supabase.from("engineers").update({ role }).eq("id", id);
    if (error) return toast.error(error.message);
    setEngineers((prev) => prev.map((e) => (e.id === id ? { ...e, role } : e)));
    toast.success("Role updated.");
  }

  async function addFloor(e: React.FormEvent) {
    e.preventDefault();
    if (!fName.trim()) return;
    setBusyF(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("floors")
        .insert({ name: fName.trim() })
        .select()
        .single();
      if (error) throw error;
      setFloors((prev) => [...prev, data as Floor]);
      setFName("");
      toast.success("Floor added.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusyF(false);
    }
  }

  async function removeFloor(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("floors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setFloors((prev) => prev.filter((f) => f.id !== id));
    toast.success("Floor removed.");
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Engineers */}
      <section className="card">
        <h2 className="font-bold mb-4">Engineers ({engineers.length})</h2>

        <form onSubmit={addEngineer} className="space-y-2 mb-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Full name"
              value={eName}
              onChange={(e) => setEName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="name@brac.net"
              value={eEmail}
              onChange={(e) => setEEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <select value={eRole} onChange={(e) => setERole(e.target.value as EngineerRole)}>
              <option value="engineer">Engineer</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={busyE} className="btn btn-primary">
              {busyE ? "Adding…" : "Add Engineer"}
            </button>
          </div>
          <p className="text-xs muted">
            The engineer must sign in with their @brac.net Google account at least once
            for the row to be linked to auth.
          </p>
        </form>

        <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin">
          {engineers.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-2 p-3 rounded-lg border"
              style={{ borderColor: "var(--border)", background: e.active ? undefined : "var(--surface-muted)" }}
            >
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{e.name}</div>
                <div className="text-xs muted truncate">{e.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={e.role}
                  onChange={(ev) => changeRole(e.id, ev.target.value as EngineerRole)}
                  className="text-xs"
                  style={{ padding: "4px 8px" }}
                >
                  <option value="engineer">Engineer</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => toggleEngineer(e.id, e.active)}
                  className="btn btn-secondary text-xs"
                  style={{ padding: "6px 10px" }}
                >
                  {e.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floors */}
      <section className="card">
        <h2 className="font-bold mb-4">Floors / Departments ({floors.length})</h2>

        <form onSubmit={addFloor} className="flex gap-2 mb-4">
          <input
            placeholder="e.g., Floor 5 – Finance"
            value={fName}
            onChange={(e) => setFName(e.target.value)}
            required
          />
          <button type="submit" disabled={busyF} className="btn btn-primary">
            {busyF ? "Adding…" : "Add"}
          </button>
        </form>

        <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin">
          {floors.length === 0 && (
            <p className="muted text-sm text-center py-6">
              No floors yet. Add a few to make the ticket form dropdown usable.
            </p>
          )}
          {floors.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-2 p-3 rounded-lg border"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="font-medium text-sm">{f.name}</div>
              <button
                onClick={() => removeFloor(f.id)}
                className="btn btn-danger text-xs"
                style={{ padding: "6px 10px" }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminPanel } from "@/components/admin-panel";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createClient();

  const [{ data: engineers }, { data: floors }] = await Promise.all([
    supabase.from("engineers").select("*").order("name"),
    supabase.from("floors").select("*").order("name")
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="muted text-sm mt-1">Manage engineers and floor/department options.</p>
      </header>

      <AdminPanel
        initialEngineers={engineers ?? []}
        initialFloors={floors ?? []}
      />
    </div>
  );
}

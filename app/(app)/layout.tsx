import Link from "next/link";
import { requireEngineer } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const engineer = await requireEngineer();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/new-ticket", label: "New Ticket", icon: "➕" },
    { href: "/tickets", label: "All Tickets", icon: "📋" }
  ];

  if (engineer.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin", icon: "⚙️" });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside
        className="md:w-64 md:min-h-screen border-r p-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              IT
            </span>
            <div>
              <div className="font-extrabold text-sm" style={{ color: "var(--accent)" }}>
                BRAC IT
              </div>
              <div className="text-xs muted -mt-0.5">Help Desk</div>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--surface-muted)]"
              style={{ color: "var(--text)" }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs muted mb-1">Signed in as</div>
          <div className="font-semibold text-sm truncate">{engineer.name}</div>
          <div className="text-xs muted truncate">{engineer.email}</div>
          {engineer.role === "admin" && (
            <div
              className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background: "rgba(236,0,140,0.14)", color: "var(--accent)" }}
            >
              Admin
            </div>
          )}
          <div className="mt-4">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 scrollbar-thin">{children}</main>
    </div>
  );
}

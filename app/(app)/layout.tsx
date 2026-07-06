import { Suspense } from "react";
import Link from "next/link";
import { requireEngineer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/notifications-bell";

async function NotificationBadge({ email }: { email: string }) {
  const supabase = createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "estimated", head: true })
    .eq("recipient_email", email)
    .eq("read", false);
  return <NotificationsBell initialUnread={count ?? 0} />;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const engineer = await requireEngineer();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/new-ticket", label: "New Ticket", icon: "➕" },
    { href: "/tickets", label: "All Tickets", icon: "📋" },
    { href: "/roster", label: "Roster", icon: "📅" },
    { href: "/feedback", label: "Feedback", icon: "⭐" }
  ];

  if (engineer.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin", icon: "⚙️" });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside
        className="md:w-64 md:min-h-screen border-r flex flex-col"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="p-5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, var(--accent), #ff6b35)" }}
            >
              IT
            </div>
            <div>
              <div className="font-extrabold text-sm gradient-text">BRAC IT</div>
              <div className="text-xs muted -mt-0.5">Help Desk</div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Suspense fallback={null}>
              <NotificationBadge email={engineer.email} />
            </Suspense>
            <ThemeToggle />
          </div>
        </div>

        <nav className="px-3 space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--text)" }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--accent), #ff6b35)" }}
            >
              {engineer.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{engineer.name}</div>
              <div className="text-xs muted truncate">{engineer.email}</div>
            </div>
          </div>
          {engineer.role === "admin" && (
            <div
              className="mb-3 text-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
              style={{ background: "var(--accent-tint)", color: "var(--accent)" }}
            >
              Admin
            </div>
          )}
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 scrollbar-thin animate-fade-in">{children}</main>
    </div>
  );
}

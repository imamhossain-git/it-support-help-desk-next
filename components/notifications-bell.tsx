"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDateTime } from "@/lib/utils";
import type { Notification } from "@/types";

export function NotificationsBell({ initialUnread }: { initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev].slice(0, 20));
          setUnread((u) => u + 1);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (open && items.length === 0) {
      const supabase = createClient();
      supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => {
          if (data) setItems(data as Notification[]);
        });
    }
  }, [open, items.length]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost relative"
        style={{ padding: "6px 10px", fontSize: 16 }}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-xl border shadow-lg z-50 animate-scale-in"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: "var(--border)" }}
          >
            <h3 className="font-bold text-sm">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold"
                style={{ color: "var(--accent)" }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
            {items.length === 0 ? (
              <p className="muted text-sm text-center py-8">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => {
                    if (!n.read) setUnread((u) => Math.max(0, u - 1));
                    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
                  }}
                  className={cn(
                    "block px-4 py-3 border-b transition-colors",
                    !n.read && "font-semibold"
                  )}
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{n.title}</div>
                      {n.body && (
                        <div className="text-xs muted mt-0.5 line-clamp-2">{n.body}</div>
                      )}
                      <div className="text-xs muted mt-1">{formatDateTime(n.created_at)}</div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

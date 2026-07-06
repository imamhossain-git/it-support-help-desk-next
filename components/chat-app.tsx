"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { ChatMessage, Engineer } from "@/types";

interface EngineerLite {
  name: string;
  email: string;
  active: boolean;
}

interface Props {
  me: { name: string; email: string; role: string };
  engineers: EngineerLite[];
  recentMessages: { room_key: string; id: string; sender_email: string; message: string; created_at: string }[];
}

function buildDmKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

export function ChatApp({ me, engineers, recentMessages }: Props) {
  const [activeRoom, setActiveRoom] = useState<string>("TEAM");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [readMap, setReadMap] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dmPartners = useMemo(() => {
    return engineers
      .filter((e) => e.email !== me.email)
      .map((e) => ({ ...e, room: buildDmKey(me.email, e.email) }));
  }, [engineers, me.email]);

  // Seed messages with the prefetched ones
  useEffect(() => {
    const seeded = recentMessages
      .map((m): ChatMessage | null => ({
        id: m.id,
        room_key: m.room_key,
        sender_email: m.sender_email,
        sender_name: m.sender_email,
        message: m.message,
        created_at: m.created_at
      }))
      .filter((m): m is ChatMessage => m !== null);
    setMessages(seeded);
  }, [recentMessages]);

  // Subscribe to realtime messages
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("chat-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mark room as read when active
  useEffect(() => {
    async function markRead() {
      const supabase = createClient();
      const { error } = await supabase
        .from("chat_reads")
        .upsert(
          { email: me.email, room_key: activeRoom, updated_at: new Date().toISOString() },
          { onConflict: "email,room_key" }
        );
      if (error) console.warn(error);
      setReadMap((prev) => ({ ...prev, [activeRoom]: new Date().toISOString() }));
    }
    markRead();
  }, [activeRoom, me.email]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeRoom]);

  const visible = messages
    .filter((m) => m.room_key === activeRoom)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("chat_messages").insert({
        room_key: activeRoom,
        sender_email: me.email,
        sender_name: me.name,
        message: trimmed
      });
      if (error) throw error;
      setText("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Send failed";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  function unreadForRoom(room: string): number {
    const readAt = readMap[room];
    const readTime = readAt ? new Date(readAt).getTime() : 0;
    return messages.filter(
      (m) => m.room_key === room && m.sender_email !== me.email && new Date(m.created_at).getTime() > readTime
    ).length;
  }

  const activeRoomLabel =
    activeRoom === "TEAM"
      ? "Team Room"
      : dmPartners.find((p) => p.room === activeRoom)?.name ?? "Chat";

  return (
    <div className="card overflow-hidden p-0 grid grid-cols-1 md:grid-cols-[260px_1fr] h-[calc(100%-4rem)]">
      {/* Rooms list */}
      <aside
        className="border-r overflow-y-auto scrollbar-thin"
        style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}
      >
        <RoomItem
          label="Team Room"
          sublabel="Everyone"
          active={activeRoom === "TEAM"}
          unread={unreadForRoom("TEAM")}
          onClick={() => setActiveRoom("TEAM")}
        />
        <div className="px-4 py-2 text-xs muted uppercase tracking-wider">Direct Messages</div>
        {dmPartners.map((p) => (
          <RoomItem
            key={p.email}
            label={p.name}
            sublabel={p.email}
            active={activeRoom === p.room}
            unread={unreadForRoom(p.room)}
            onClick={() => setActiveRoom(p.room)}
          />
        ))}
      </aside>

      {/* Conversation */}
      <section className="flex flex-col">
        <header
          className="px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-bold">{activeRoomLabel}</h2>
          <p className="text-xs muted">
            {activeRoom === "TEAM" ? "All engineers" : activeRoomLabel}
          </p>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-3"
          style={{ minHeight: 200 }}
        >
          {visible.length === 0 ? (
            <p className="muted text-center text-sm py-10">No messages yet. Say hi 👋</p>
          ) : (
            visible.map((m, i) => {
              const mine = m.sender_email === me.email;
              const prev = visible[i - 1];
              const showHeader = !prev || prev.sender_email !== m.sender_email;
              return (
                <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                  {showHeader && (
                    <div className="text-xs muted mb-1">
                      {m.sender_name || m.sender_email}{" "}
                      <span className="opacity-60">· {formatDateTime(m.created_at)}</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words",
                      mine
                        ? "rounded-br-sm"
                        : "rounded-bl-sm border"
                    )}
                    style={
                      mine
                        ? { background: "var(--accent)", color: "#fff" }
                        : { background: "var(--surface)", borderColor: "var(--border)" }
                    }
                  >
                    {m.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={send}
          className="border-t px-4 py-3 flex items-center gap-2"
          style={{ borderColor: "var(--border)" }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${activeRoomLabel}…`}
            autoFocus
          />
          <button type="submit" disabled={sending || !text.trim()} className="btn btn-primary">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}

function RoomItem({
  label,
  sublabel,
  active,
  unread,
  onClick
}: {
  label: string;
  sublabel: string;
  active: boolean;
  unread: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 transition-colors flex items-center gap-3"
      )}
      style={{
        background: active ? "var(--surface)" : "transparent",
        borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent"
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{label}</div>
        <div className="text-xs muted truncate">{sublabel}</div>
      </div>
      {unread > 0 && (
        <span
          className="text-xs font-bold rounded-full px-2 py-0.5"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {unread}
        </span>
      )}
    </button>
  );
}

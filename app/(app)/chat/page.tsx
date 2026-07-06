import { requireEngineer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChatApp } from "@/components/chat-app";

export default async function ChatPage() {
  const engineer = await requireEngineer();
  const supabase = createClient();

  const [{ data: engineers }, { data: rooms }] = await Promise.all([
    supabase.from("engineers").select("id,name,email,active").eq("active", true).order("name"),
    supabase.from("chat_messages").select("room_key, id, sender_email, message, created_at").order("created_at", { ascending: false }).limit(500)
  ]);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-3rem)]">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="muted text-sm mt-1">Team room and direct messages — updates in real time.</p>
      </header>

      <ChatApp
        me={engineer}
        engineers={(engineers ?? []).map((e) => ({ name: e.name, email: e.email, active: e.active }))}
        recentMessages={(rooms ?? []) as { room_key: string; id: string; sender_email: string; message: string; created_at: string }[]}
      />
    </div>
  );
}

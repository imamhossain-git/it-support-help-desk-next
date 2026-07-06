import { requireEngineer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FeedbackView } from "@/components/feedback-view";

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function FeedbackPage({ searchParams }: PageProps) {
  await requireEngineer();
  const params = await searchParams;
  const supabase = createClient();

  const [{ data: feedback }, { data: engineers }] = await Promise.all([
    supabase.from("feedback").select("*").order("created_at", { ascending: false }),
    supabase.from("engineers").select("id,name,email,active").eq("active", true).order("name")
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="muted text-sm mt-1">
          Customer satisfaction ratings per engineer.
        </p>
      </header>

      <FeedbackView
        initialFeedback={(feedback ?? []) as any}
        engineers={(engineers ?? []).map((e) => ({ name: e.name, email: e.email }))}
        currentMonth={params.month}
      />
    </div>
  );
}

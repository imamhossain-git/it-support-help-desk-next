import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SignInPage() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      queryParams: { hd: "brac.net" }
    }
  });

  if (error || !data?.url) {
    redirect("/auth/login?error=Sign-in%20failed.%20Please%20try%20again.");
  }

  redirect(data.url);
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function NoAccessPage() {
  const supabase = createClient();
  await supabase.auth.signOut();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-md text-center">
        <h1 className="text-xl font-bold mb-2">Account not provisioned</h1>
        <p className="muted text-sm mb-6">
          Your Google account is signed in, but you are not registered as an
          engineer. Please ask an admin to add your email.
        </p>
        <Link href="/auth/login" className="btn btn-primary w-full">
          Back to login
        </Link>
      </div>
    </main>
  );
}

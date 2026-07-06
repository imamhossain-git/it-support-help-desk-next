import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, getCurrentEngineer } from "@/lib/auth";
import { SignInButton } from "@/components/sign-in-button";

interface PageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getSession();
  if (user) {
    const engineer = await getCurrentEngineer();
    redirect(engineer ? (params.next ?? "/dashboard") : "/auth/no-access");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-md text-center">
        <div className="text-sm font-extrabold tracking-wide" style={{ color: "var(--accent)" }}>
          BRAC IT SUPPORT
        </div>
        <h1 className="text-2xl font-bold mt-2 mb-2">Help Desk</h1>
        <p className="muted text-sm mb-6">
          Sign in with your BRAC Google Workspace account.
        </p>

        <SignInButton next={params.next} />

        <p className="text-xs muted mt-6">
          Only <strong>@brac.net</strong> accounts are allowed.
        </p>

        {params.error && (
          <p className="mt-4 text-sm" style={{ color: "var(--danger)" }}>
            {params.error}
          </p>
        )}
      </div>
    </main>
  );
}

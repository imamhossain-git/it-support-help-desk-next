import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Engineer } from "@/types";

export async function getSession() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export async function requireSession() {
  const user = await getSession();
  if (!user) redirect("/auth/login");
  return user;
}

export async function getCurrentEngineer(): Promise<Engineer | null> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("engineers")
    .select("*")
    .eq("email", user.email)
    .eq("active", true)
    .maybeSingle();

  return (data as Engineer | null) ?? null;
}

export async function requireEngineer(): Promise<Engineer> {
  const engineer = await getCurrentEngineer();
  if (!engineer) {
    redirect("/auth/login?error=Account%20not%20provisioned.%20Contact%20an%20admin.");
  }
  return engineer;
}

export async function requireAdmin(): Promise<Engineer> {
  const engineer = await requireEngineer();
  if (engineer.role !== "admin") {
    redirect("/dashboard?error=Admins%20only");
  }
  return engineer;
}

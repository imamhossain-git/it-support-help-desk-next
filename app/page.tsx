import { redirect } from "next/navigation";
import { getSession, getCurrentEngineer } from "@/lib/auth";

export default async function HomePage() {
  const user = await getSession();
  if (!user) redirect("/auth/login");
  const engineer = await getCurrentEngineer();
  redirect(engineer ? "/dashboard" : "/auth/no-access");
}

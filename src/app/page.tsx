import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import LandingPage from "@/components/landing/LandingPage";

export default async function DashboardPage() {
  await connection();

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return <LandingPage />;
  }

  // Redirect authenticated user to Quests (first primary tab)
  redirect("/quests");
}

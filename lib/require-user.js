import "server-only";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isAzureAuthConfigured } from "./auth";

export async function requireUser() {
  if (!isAzureAuthConfigured()) {
    redirect("/login");
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

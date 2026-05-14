import { auth } from "@/app/lib/auth";
import { getEnhancedPrisma } from "@/app/lib/db";
import { NextRequestHandler } from "@zenstackhq/server/next";
import { headers } from "next/headers";

async function getPrisma() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return getEnhancedPrisma(session);
}

const handler = NextRequestHandler({ getPrisma, useAppDir: true });

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };

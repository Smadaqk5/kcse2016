import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");
  const hasDirectUrl = Boolean(process.env.DIRECT_URL && process.env.DIRECT_URL.trim() !== "");
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.trim() !== "");
  const hasSupabaseAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() !== "");
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim() !== "");

  let isConnected = false;
  let connectionError: string | null = null;
  let stats = {
    users: 0,
    papers: 0,
    packages: 0,
    subscriptions: 0,
  };

  if (hasDatabaseUrl) {
    try {
      const [userCount, paperCount, packageCount, subCount] = await Promise.all([
        prisma.user.count(),
        prisma.paper.count(),
        prisma.subscriptionPackage.count(),
        prisma.subscription.count(),
      ]);
      isConnected = true;
      stats = {
        users: userCount,
        papers: paperCount,
        packages: packageCount,
        subscriptions: subCount,
      };
    } catch (err: unknown) {
      connectionError = err instanceof Error ? err.message : "Connection failed";
    }
  }

  return NextResponse.json({
    configured: {
      hasDatabaseUrl,
      hasDirectUrl,
      hasSupabaseUrl,
      hasSupabaseAnonKey,
      hasServiceRoleKey,
    },
    liveStatus: isConnected ? "connected" : hasDatabaseUrl ? "error" : "mock_fallback",
    connectionError,
    stats,
  });
}

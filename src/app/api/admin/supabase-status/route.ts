import { NextResponse } from "next/server";
import { prisma, isPlaceholderDbUrl } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawDbUrl = process.env.DATABASE_URL;
  const rawDirectUrl = process.env.DIRECT_URL;
  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const hasDatabaseUrl = Boolean(rawDbUrl && !isPlaceholderDbUrl(rawDbUrl));
  const hasDirectUrl = Boolean(rawDirectUrl && !isPlaceholderDbUrl(rawDirectUrl));
  const hasSupabaseUrl = Boolean(rawSupabaseUrl && !rawSupabaseUrl.includes("YOUR_PROJECT_REF") && rawSupabaseUrl.trim() !== "");
  const hasSupabaseAnonKey = Boolean(rawAnonKey && !rawAnonKey.includes("YOUR_ANON_KEY") && rawAnonKey.trim() !== "");
  const hasServiceRoleKey = Boolean(rawServiceKey && !rawServiceKey.includes("YOUR_SERVICE_KEY") && rawServiceKey.trim() !== "");

  let isConnected = false;
  let connectionError: string | null = null;
  let stats = {
    users: 0,
    papers: 0,
    packages: 0,
    subscriptions: 0,
  };

  // Always fetch stats (from real DB if configured or active in-memory store)
  try {
    const [userCount, paperCount, packageCount, subCount] = await Promise.all([
      prisma.user.count(),
      prisma.paper.count(),
      prisma.subscriptionPackage.count(),
      prisma.subscription.count(),
    ]);
    stats = {
      users: userCount,
      papers: paperCount,
      packages: packageCount,
      subscriptions: subCount,
    };
  } catch (err: unknown) {
    connectionError = err instanceof Error ? err.message : "Count failed";
  }

  if (hasDatabaseUrl) {
    try {
      if (prisma.$queryRaw) {
        await prisma.$queryRaw`SELECT 1`;
      }
      isConnected = true;
      connectionError = null;
    } catch (err: unknown) {
      isConnected = false;
      connectionError = err instanceof Error ? err.message : "Database connection failed";
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

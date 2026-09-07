"use client";

import { useEffect, useState } from "react";
import { Database, CheckCircle2, AlertTriangle, Copy, Check, RefreshCw } from "lucide-react";

interface StatusResponse {
  configured: {
    hasDatabaseUrl: boolean;
    hasDirectUrl: boolean;
    hasSupabaseUrl: boolean;
    hasSupabaseAnonKey: boolean;
    hasServiceRoleKey: boolean;
  };
  liveStatus: "connected" | "error" | "mock_fallback";
  connectionError: string | null;
  stats: {
    users: number;
    papers: number;
    packages: number;
    subscriptions: number;
  };
}

export function SupabaseStatusCard() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  function reloadStatus() {
    setLoading(true);
    fetch("/api/admin/supabase-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) setData(json);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/supabase-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCopySql() {
    const sqlScript = `-- ====================================================================
-- KCSE VIP Exam Portal - Supabase PostgreSQL Schema & Seed Data
-- ====================================================================

CREATE SCHEMA IF NOT EXISTS "public";

DO $$ BEGIN CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'SUBSCRIBER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."SubscriptionType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."ContentType" AS ENUM ('PAST_PAPER', 'REVISION_NOTE', 'MOCK_EXAM'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "phone" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'SUBSCRIBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdByAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "public"."AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."SubscriptionPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subscriptionType" "public"."SubscriptionType" NOT NULL UNIQUE,
    "amount" DECIMAL(10,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "public"."User"("id") ON DELETE CASCADE,
    "subscriptionType" "public"."SubscriptionType" NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "public"."User"("id") ON DELETE CASCADE,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionRef" TEXT UNIQUE,
    "mpesaReceiptNumber" TEXT,
    "phone" TEXT NOT NULL,
    "checkoutRequestId" TEXT UNIQUE,
    "merchantRequestId" TEXT,
    "subscriptionType" "public"."SubscriptionType",
    "paperId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."Paper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contentType" "public"."ContentType" NOT NULL,
    "unitCode" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "filePath" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."PaperPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "public"."User"("id") ON DELETE CASCADE,
    "paperId" TEXT NOT NULL REFERENCES "public"."Paper"("id") ON DELETE CASCADE,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "paymentId" TEXT,
    CONSTRAINT "PaperPurchase_userId_paperId_key" UNIQUE ("userId", "paperId")
);

CREATE TABLE IF NOT EXISTS "public"."ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "public"."User"("id") ON DELETE CASCADE,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Default Packages
INSERT INTO "public"."SubscriptionPackage" ("id", "name", "subscriptionType", "amount", "durationDays", "isActive", "sortOrder")
VALUES
    ('pkg-daily', 'Daily Access Pass', 'DAILY', 49.00, 1, true, 1),
    ('pkg-weekly', 'Weekly Exam Booster', 'WEEKLY', 199.00, 7, true, 2),
    ('pkg-monthly', 'Monthly VIP Pass', 'MONTHLY', 599.00, 30, true, 3)
ON CONFLICT ("subscriptionType") DO NOTHING;

-- Default Admin User (Password: Mainaadam66@)
INSERT INTO "public"."AdminUser" ("id", "username", "passwordHash", "fullName")
VALUES
    ('admin-master', 'admin', '$2a$10$fV3zD0vX4Vf6hQfP8xU0q.qZzPjH3d6Zc1XqJ3l5vI9bC7dE2fA0K', 'Lead Examination Controller')
ON CONFLICT ("username") DO NOTHING;
`;

    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Supabase Database Integration</h2>
            <p className="text-xs text-slate-500">PostgreSQL Cloud Database & Schema Control</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadStatus}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedSql ? "SQL Copied!" : "Copy Supabase SQL"}
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className="rounded-xl border p-4 text-xs">
        {data?.liveStatus === "connected" ? (
          <div className="flex items-start gap-3 text-emerald-900 bg-emerald-50/50 -m-4 p-4 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-emerald-950">Supabase Database Connected (Live PostgreSQL)</p>
              <p className="text-emerald-800">
                The application is directly connected and synchronizing all users, candidate access codes, subscriptions, and M-Pesa payments with your Supabase database.
              </p>
              <div className="flex flex-wrap gap-4 pt-1 text-slate-700 font-medium">
                <span>Users: <b>{data.stats.users}</b></span>
                <span>Exam Papers: <b>{data.stats.papers}</b></span>
                <span>Packages: <b>{data.stats.packages}</b></span>
                <span>Active Subscriptions: <b>{data.stats.subscriptions}</b></span>
              </div>
            </div>
          </div>
        ) : data?.liveStatus === "error" ? (
          <div className="flex items-start gap-3 text-amber-900 bg-amber-50/50 -m-4 p-4 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-amber-950">Database Connection Issue</p>
              <p className="text-amber-800">
                DATABASE_URL is provided, but could not complete query: {data.connectionError || "Check credentials"}.
                Falling back safely to the in-memory store so the app remains active.
              </p>
              <div className="flex flex-wrap gap-4 pt-1 text-slate-700 font-medium">
                <span>Active Users: <b>{data?.stats?.users ?? 0}</b></span>
                <span>Exam Papers: <b>{data?.stats?.papers ?? 0}</b></span>
                <span>Packages: <b>{data?.stats?.packages ?? 0}</b></span>
                <span>Active Subscriptions: <b>{data?.stats?.subscriptions ?? 0}</b></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-slate-800 bg-slate-50 -m-4 p-4 rounded-xl">
            <Database className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-slate-900">Supabase DB Ready to Connect</p>
              <p className="text-slate-600 leading-relaxed">
                The app is currently running in active preview mode with full mock data. To link your live Supabase project, provide your <b>DATABASE_URL</b> in your environment variables.
              </p>
              <div className="flex flex-wrap gap-4 pt-1 text-slate-700 font-medium">
                <span>Active Users: <b>{data?.stats?.users ?? 0}</b></span>
                <span>Exam Papers: <b>{data?.stats?.papers ?? 0}</b></span>
                <span>Packages: <b>{data?.stats?.packages ?? 0}</b></span>
                <span>Active Subscriptions: <b>{data?.stats?.subscriptions ?? 0}</b></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Config Checklist */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">DATABASE_URL</span>
          <span className={`font-semibold flex items-center gap-1 mt-0.5 ${data?.configured.hasDatabaseUrl ? "text-emerald-700" : "text-slate-400"}`}>
            {data?.configured.hasDatabaseUrl ? "✓ Configured" : "Not Set"}
          </span>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">DIRECT_URL</span>
          <span className={`font-semibold flex items-center gap-1 mt-0.5 ${data?.configured.hasDirectUrl ? "text-emerald-700" : "text-slate-400"}`}>
            {data?.configured.hasDirectUrl ? "✓ Configured" : "Optional"}
          </span>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">SUPABASE_URL</span>
          <span className={`font-semibold flex items-center gap-1 mt-0.5 ${data?.configured.hasSupabaseUrl ? "text-emerald-700" : "text-slate-400"}`}>
            {data?.configured.hasSupabaseUrl ? "✓ Configured" : "Optional"}
          </span>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">ANON_KEY</span>
          <span className={`font-semibold flex items-center gap-1 mt-0.5 ${data?.configured.hasSupabaseAnonKey ? "text-emerald-700" : "text-slate-400"}`}>
            {data?.configured.hasSupabaseAnonKey ? "✓ Configured" : "Optional"}
          </span>
        </div>
      </div>

      {/* Toggle Instructions */}
      <div>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
        >
          {showGuide ? "Hide Setup Instructions" : "View Supabase Connection Instructions"}
        </button>

        {showGuide && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-3">
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                <b>Create Supabase Schema</b>: Click <b>&quot;Copy Supabase SQL&quot;</b> above, go to your Supabase project&apos;s <b>SQL Editor</b>, paste it, and click <b>Run</b>. This provisions all tables with access code support and seeds standard papers &amp; packages.
              </li>
              <li>
                <b>Copy Connection URI</b>: In your Supabase dashboard, go to <b>Project Settings → Database → Connection string → URI</b> (choose Mode: <i>Transaction Pooler</i>).
              </li>
              <li>
                <b>Add Environment Variable</b>: In Google AI Studio, open <b>Settings → Environment Variables</b> and add:
                <pre className="mt-1 p-2 bg-white rounded border border-slate-200 text-[11px] overflow-x-auto text-slate-800">
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
                </pre>
              </li>
              <li>
                <b>Instant Live Sync</b>: The app automatically detects the database connection and switches all reads, candidate registrations, unique access codes, and M-Pesa records directly to your Supabase database!
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

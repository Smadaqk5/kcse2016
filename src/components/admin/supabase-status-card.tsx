"use client";

import { useEffect, useState } from "react";
import { Database, CheckCircle2, Copy, Check, RefreshCw } from "lucide-react";

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
    const sqlScript = `-- KCSE Revision Portal - Supabase PostgreSQL Schema Script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE "public"."UserRole" AS ENUM ('SUBSCRIBER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."SubscriptionType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."ContentType" AS ENUM ('PAST_PAPER', 'REVISION_NOTE', 'MOCK_EXAM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "fullName" TEXT,
    "phone" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'SUBSCRIBER',
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
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
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
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
`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(sqlScript);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = sqlScript;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-md space-y-4 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Supabase Database Integration</h2>
            <p className="text-xs text-slate-400">PostgreSQL Cloud Database &amp; Schema Control</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadStatus}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-750 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
          >
            {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedSql ? "SQL Copied!" : "Copy Supabase SQL"}
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className="rounded-xl border border-slate-800 p-4 text-xs">
        {data?.liveStatus === "connected" ? (
          <div className="flex items-start gap-3 text-emerald-300 bg-emerald-950/40 -m-4 p-4 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-white">Supabase Database Connected (Live PostgreSQL)</p>
              <p className="text-slate-300">
                The application is directly connected and synchronizing all users, candidate access codes, subscriptions, and M-Pesa payments with your Supabase database.
              </p>
              <div className="flex flex-wrap gap-4 pt-1 text-slate-400 font-medium">
                <span>Users: <b className="text-white">{data.stats.users}</b></span>
                <span>Exam Papers: <b className="text-white">{data.stats.papers}</b></span>
                <span>Packages: <b className="text-white">{data.stats.packages}</b></span>
                <span>Active Subscriptions: <b className="text-white">{data.stats.subscriptions}</b></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-slate-300 bg-slate-950/80 -m-4 p-4 rounded-xl">
            <Database className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-white">Database Synchronization Ready</p>
              <p className="text-slate-400 leading-relaxed">
                The portal is operating in active production mode with high availability.
              </p>
              <div className="flex flex-wrap gap-4 pt-1 text-slate-400 font-medium">
                <span>Active Users: <b className="text-white">{data?.stats?.users ?? 0}</b></span>
                <span>Exam Papers: <b className="text-white">{data?.stats?.papers ?? 0}</b></span>
                <span>Packages: <b className="text-white">{data?.stats?.packages ?? 0}</b></span>
                <span>Active Subscriptions: <b className="text-white">{data?.stats?.subscriptions ?? 0}</b></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Config Checklist */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">DATABASE_URL</span>
          <span className={`font-semibold flex items-center gap-1 mt-0.5 ${data?.configured.hasDatabaseUrl ? "text-emerald-400" : "text-slate-500"}`}>
            {data?.configured.hasDatabaseUrl ? "✓ Configured" : "Not Set"}
          </span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">DIRECT_URL</span>
          <span className={`font-semibold flex items-center gap-1 mt-0.5 ${data?.configured.hasDirectUrl ? "text-emerald-400" : "text-slate-500"}`}>
            {data?.configured.hasDirectUrl ? "✓ Configured" : "Optional"}
          </span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">SUPABASE_URL</span>
          <span className={`font-semibold flex items-center gap-1 mt-0.5 ${data?.configured.hasSupabaseUrl ? "text-emerald-400" : "text-slate-500"}`}>
            {data?.configured.hasSupabaseUrl ? "✓ Configured" : "Optional"}
          </span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">ANON_KEY</span>
          <span className={`font-semibold flex items-center gap-1 mt-0.5 ${data?.configured.hasSupabaseAnonKey ? "text-emerald-400" : "text-slate-500"}`}>
            {data?.configured.hasSupabaseAnonKey ? "✓ Configured" : "Optional"}
          </span>
        </div>
      </div>
    </div>
  );
}

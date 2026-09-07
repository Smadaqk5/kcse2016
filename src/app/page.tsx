import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  KeyRound,
  Lock,
  CheckCircle2,
  ArrowRight,
  Smartphone,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  let dailyPrice = 49;
  let weeklyPrice = 199;
  let monthlyPrice = 599;

  try {
    const dbPlans = await prisma.subscriptionPackage.findMany({
      where: { isActive: true },
    });
    dbPlans.forEach((p) => {
      if (p.subscriptionType === "DAILY") dailyPrice = Number(p.amount);
      if (p.subscriptionType === "WEEKLY") weeklyPrice = Number(p.amount);
      if (p.subscriptionType === "MONTHLY") monthlyPrice = Number(p.amount);
    });
  } catch {
    // Uses defaults
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#05966910_1px,transparent_1px),linear-gradient(to_bottom,#05966910_1px,transparent_1px)] bg-[size:28px_28px] opacity-20" />

        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Simplified Access Code Login & M-Pesa STK Checkout</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            <span className="text-emerald-400">VIP KCSE Exam Papers</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-lg text-slate-300 leading-relaxed">
            Immediate view-only access to official KCSE papers and complete KNEC marking schemes. Log in with your unique candidate access code and pay directly via Lipa na M-Pesa STK push.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              id="hero-register-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
            >
              <span>Get My Unique Access Code</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              id="hero-login-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Log In with Code</span>
            </Link>
          </div>

          {/* Highlights */}
          <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <KeyRound className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Simple Unique Access Code Login</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Direct Lipa na M-Pesa STK Push</span>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 text-slate-300">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Watermarked Candidate Protection</span>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Section */}
      <section className="py-16 px-4 sm:px-6 mx-auto max-w-6xl">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Subscription Tiers
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Flexible Revision Plans via M-Pesa
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Choose a plan tailored to your revision timeline. Instant automated activation straight to your mobile.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Daily Pass</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quick 24-hour cram session</p>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-slate-900">KES {dailyPrice}</span>
                <span className="text-xs text-slate-500 ml-1">/ 1 day</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>24 hours full access to all papers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>KNEC marking schemes included</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>M-Pesa prompt sent directly to phone</span>
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="mt-6 w-full py-2.5 rounded-lg border border-slate-300 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Choose Daily Pass
            </Link>
          </div>

          {/* Weekly */}
          <div className="rounded-2xl border-2 border-emerald-700 bg-white p-6 shadow-md relative flex flex-col justify-between ring-1 ring-emerald-700/20">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Most Popular
            </span>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Weekly Booster</h3>
                <p className="text-xs text-slate-500 mt-0.5">Best for mock exam preparation</p>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-slate-900">KES {weeklyPrice}</span>
                <span className="text-xs text-slate-500 ml-1">/ 7 days</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>7 days unlimited exam viewer access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All subjects: Math, Eng, Kisw, Sciences & Humanities</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Instant activation via Lipa na M-Pesa</span>
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="mt-6 w-full py-2.5 rounded-lg bg-emerald-700 text-center text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-sm"
            >
              Subscribe Weekly
            </Link>
          </div>

          {/* Monthly */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Monthly VIP</h3>
                <p className="text-xs text-slate-500 mt-0.5">Comprehensive revision until exams</p>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-slate-900">KES {monthlyPrice}</span>
                <span className="text-xs text-slate-500 ml-1">/ 30 days</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>30 days continuous access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Top national school mock predictions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Protected watermarked access</span>
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="mt-6 w-full py-2.5 rounded-lg border border-slate-300 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Choose Monthly VIP
            </Link>
          </div>
        </div>
      </section>

      {/* Security & Workflow Breakdown */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How the Revision Platform Works
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Ultra-simple candidate access code login paired with fast M-Pesa mobile transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-sm text-slate-900">Get Access Code</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register with your phone number and receive your unique candidate access code instantly.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-900">Paste & Sign In</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Paste your saved code to sign into your account from any phone, tablet, or computer.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-900">Lipa na M-Pesa</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select your pass and enter your M-Pesa PIN on the automated SIM popup prompt.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="font-bold text-sm text-slate-900">Revise & Excel</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Study with point-by-point KNEC marking schemes in the protected, watermarked viewer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 px-4 sm:px-6 mx-auto max-w-4xl text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Ready to begin your KCSE revision?
        </h2>
        <p className="text-slate-600 text-sm max-w-lg mx-auto">
          Get your unique Access Code in 10 seconds and unlock verified examination materials.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-colors shadow-sm"
          >
            Get My Unique Access Code
          </Link>
          <Link
            href="/papers"
            className="w-full sm:w-auto px-6 py-3 rounded-lg border border-slate-300 bg-white text-slate-800 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Browse Available Papers
          </Link>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  KeyRound,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  BookOpen,
  ShoppingCart,
} from "lucide-react";

import { fetchPackagesFromFirestore } from "@/lib/firebase-db";

export const dynamic = "force-dynamic";

export default async function Home() {
  let dailyPrice = 1500;
  let weeklyPrice = 5500;
  let monthlyPrice = 12500;

  try {
    const firestorePlans = await fetchPackagesFromFirestore().catch(() => []);
    if (firestorePlans.length > 0) {
      firestorePlans.forEach((p) => {
        if (p.subscriptionType === "DAILY") dailyPrice = Number(p.amount);
        if (p.subscriptionType === "WEEKLY") weeklyPrice = Number(p.amount);
        if (p.subscriptionType === "MONTHLY") monthlyPrice = Number(p.amount);
      });
    } else {
      const dbPlans = await prisma.subscriptionPackage.findMany({
        where: { isActive: true },
      });
      dbPlans.forEach((p) => {
        if (p.subscriptionType === "DAILY") dailyPrice = Number(p.amount);
        if (p.subscriptionType === "WEEKLY") weeklyPrice = Number(p.amount);
        if (p.subscriptionType === "MONTHLY") monthlyPrice = Number(p.amount);
      });
    }
  } catch {
    // Uses defaults
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900/90 to-[#090d16] text-white py-16 sm:py-24 px-4 sm:px-6 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#05966915_1px,transparent_1px),linear-gradient(to_bottom,#05966915_1px,transparent_1px)] bg-[size:32px_32px] opacity-25 pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-4 py-1.5 text-xs font-semibold text-emerald-300 shadow-md">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Simplified Access Code Login &amp; Lipa na M-Pesa STK</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            <span>VIP KCSE 2026 </span>
            <span className="text-emerald-400">Exam Portal</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-lg text-slate-300 leading-relaxed">
            Immediate view-only access to official KCSE examination papers and complete KNEC marking schemes. Log in with your candidate access code and unlock exam materials instantly via M-Pesa.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              id="hero-register-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/50 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all active:scale-98"
            >
              <span>Get My Unique Access Code</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/papers"
              id="hero-papers-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-6 py-3.5 text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-all active:scale-98"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Browse All Papers</span>
            </Link>

            <Link
              href="/checkout"
              id="hero-checkout-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-800/80 bg-emerald-950/40 px-5 py-3.5 text-sm font-bold text-emerald-300 hover:bg-emerald-900/50 hover:text-white transition-all active:scale-98"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>Cart &amp; Checkout</span>
            </Link>

            <Link
              href="/login"
              id="hero-login-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-5 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-all active:scale-98"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Log In with Code</span>
            </Link>
          </div>

          {/* Highlights */}
          <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <KeyRound className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Unique Access Code Login</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Direct Lipa na M-Pesa STK</span>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Protected Digital Watermark</span>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Section */}
      <section className="py-16 px-4 sm:px-6 mx-auto max-w-6xl">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60">
            Subscription Tiers
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Flexible Access Plans via M-Pesa
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Choose a plan tailored to your study timeline. Instant automated activation straight to your mobile phone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-md flex flex-col justify-between hover:border-slate-700 transition">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Daily Pass</h3>
                <p className="text-xs text-slate-400 mt-0.5">Quick 24-hour cram session</p>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">KES {dailyPrice}</span>
                <span className="text-xs text-slate-400 ml-1">/ 1 day</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>24 hours full access to all papers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>KNEC marking schemes included</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>M-Pesa prompt sent directly to phone</span>
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="mt-6 w-full py-3 rounded-xl border border-slate-700 bg-slate-800 text-center text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              Choose Daily Pass
            </Link>
          </div>

          {/* Weekly */}
          <div className="rounded-2xl border-2 border-emerald-500 bg-slate-900 p-6 shadow-xl relative flex flex-col justify-between ring-1 ring-emerald-500/30">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Most Popular
            </span>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Weekly Booster</h3>
                <p className="text-xs text-slate-400 mt-0.5">Best for mock exam preparation</p>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">KES {weeklyPrice}</span>
                <span className="text-xs text-slate-400 ml-1">/ 7 days</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>7 days unlimited exam viewer access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All subjects: Math, Eng, Kisw, Sciences &amp; Humanities</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instant activation via Lipa na M-Pesa</span>
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="mt-6 w-full py-3 rounded-xl bg-emerald-600 text-center text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-950"
            >
              Subscribe Weekly
            </Link>
          </div>

          {/* Monthly */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-md flex flex-col justify-between hover:border-slate-700 transition">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Monthly VIP</h3>
                <p className="text-xs text-slate-400 mt-0.5">Comprehensive study until exams</p>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">KES {monthlyPrice}</span>
                <span className="text-xs text-slate-400 ml-1">/ 30 days</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>30 days continuous access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Top national school mock predictions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Protected watermarked access</span>
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="mt-6 w-full py-3 rounded-xl border border-slate-700 bg-slate-800 text-center text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              Choose Monthly VIP
            </Link>
          </div>
        </div>
      </section>

      {/* Security & Workflow Breakdown */}
      <section className="bg-slate-950/80 border-y border-slate-800 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              How the Examination Platform Works
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Ultra-simple candidate access code login paired with fast M-Pesa mobile transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-base text-white">Get Access Code</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Register with your phone number and receive your unique candidate access code instantly.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-base text-white">Paste &amp; Sign In</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste your saved code to sign into your account from any phone, tablet, or computer.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-base text-white">Lipa na M-Pesa</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select your pass and enter your M-Pesa PIN on the automated SIM popup prompt.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="font-bold text-base text-white">Study &amp; Excel</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Study with point-by-point KNEC marking schemes in the protected, watermarked viewer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 px-4 sm:px-6 mx-auto max-w-4xl text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Ready to begin your KCSE exam preparation?
        </h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Get your unique Access Code in 10 seconds and unlock verified examination materials.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition shadow-lg shadow-emerald-950"
          >
            Get My Unique Access Code
          </Link>
          <Link
            href="/papers"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 font-bold text-sm hover:bg-slate-800 hover:text-white transition"
          >
            Browse Available Papers
          </Link>
        </div>
      </section>
    </div>
  );
}

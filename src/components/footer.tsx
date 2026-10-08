import Link from "next/link";
import { ShieldCheck, Zap, Lock, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto bg-slate-950 border-t border-slate-800 text-slate-400 text-xs">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-850">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
            <span className="font-bold text-white text-sm">Past Papers Hub • KCSE 2026</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400">Verified Exam Revision Portal</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Access Code Security
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Lipa na M-Pesa
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Anti-Screenshot Protection
            </span>
          </div>
        </div>

        {/* Support and Quick Links */}
        <div className="py-6 border-b border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-slate-400">24/7 Candidate Support:</span>
            <a
              href="https://wa.me/14144015805?text=Hello%20KCSE%20Support%2C%20I%20need%20assistance"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 font-semibold text-emerald-300 hover:bg-emerald-900 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp +14144015805</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <Link href="/contact" className="hover:text-emerald-400 transition-colors font-medium">
              Contact Desk
            </Link>
            <Link href="/pricing" className="hover:text-emerald-400 transition-colors">
              Pricing Plans
            </Link>
            <Link href="/papers" className="hover:text-emerald-400 transition-colors">
              Exam Papers
            </Link>
            <Link href="/login" className="hover:text-emerald-400 transition-colors">
              Candidate Login
            </Link>
            <Link href="/admin/login" className="hover:text-slate-500 transition-colors text-[11px]">
              Admin
            </Link>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px] text-center sm:text-left">
          <p>© {new Date().getFullYear()} Past Papers Hub. All rights reserved.</p>
          <p className="text-slate-500">
            Protected view-only digital examination materials.
          </p>
        </div>
      </div>
    </footer>
  );
}

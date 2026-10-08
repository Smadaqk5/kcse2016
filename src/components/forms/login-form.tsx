"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, ArrowRight, CheckCircle2, AlertCircle, ClipboardPaste, MessageCircle } from "lucide-react";

export function LoginForm() {
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanCode = accessCode.trim();
    if (!cleanCode) {
      setError("Please enter your unique Access Code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode: cleanCode,
          username: cleanCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid Access Code. Please check the code you saved.");
        setLoading(false);
        return;
      }

      setSuccess(
        data.role === "ADMIN"
          ? "Administrator verified! Opening Admin Dashboard..."
          : "Access verified! Opening your portal..."
      );
      setTimeout(() => {
        window.location.href = data.redirect || (data.role === "ADMIN" ? "/admin/dashboard" : "/dashboard");
      }, 300);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handlePaste() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setAccessCode(text.trim());
          return;
        }
      }
      // Fallback prompt if clipboard access is blocked by browser permissions
      const manual = window.prompt("Paste your access code here:");
      if (manual) {
        setAccessCode(manual.trim());
      }
    } catch {
      const manual = window.prompt("Paste your access code here:");
      if (manual) {
        setAccessCode(manual.trim());
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl text-slate-100">
      <div className="text-center pb-5 border-b border-slate-800 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-md">
          <KeyRound className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full">
          Candidate Portal
        </span>
        <h1 className="text-2xl font-black text-white mt-2">Sign In to Candidate Portal</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Enter your unique Access Code or M-Pesa phone number to access your account.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl border border-rose-800 bg-rose-950/60 text-xs text-rose-200 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 rounded-xl border border-emerald-800 bg-emerald-950/60 text-xs text-emerald-200 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Access Code or Phone Number
            </label>
            <button
              type="button"
              onClick={handlePaste}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste from clipboard</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              required
              autoFocus
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="e.g. KCSE-7842-9134 or 0712345678"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base font-mono uppercase tracking-wider text-white placeholder:text-slate-500 placeholder:normal-case transition"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Tip: You can use your unique Access Code or your M-Pesa phone number (e.g. 07... or 01...).
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            id="login-submit-btn"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer active:scale-98"
          >
            {loading ? (
              <span>Verifying Access Code...</span>
            ) : (
              <>
                <span>Enter Revision Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-800 space-y-3 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>Don&apos;t have an access code?</span>
          <Link href="/register" className="font-bold text-emerald-400 hover:underline">
            Register &amp; Get Code →
          </Link>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span>Lost code or need help?</span>
          <a
            href="https://wa.me/14144015805?text=Hello%20KCSE%20Support%2C%20I%20lost%20my%20access%20code"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <MessageCircle className="w-3 h-3" />
            <span>WhatsApp (+14144015805)</span>
          </a>
        </div>
      </div>
    </div>
  );
}

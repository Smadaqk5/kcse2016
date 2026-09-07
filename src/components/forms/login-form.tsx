"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, ArrowRight, CheckCircle2, AlertCircle, ClipboardPaste, Lock } from "lucide-react";

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
      const text = await navigator.clipboard.readText();
      if (text) {
        setAccessCode(text.trim());
      }
    } catch {
      // clipboard permission denied or not supported
    }
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="text-center pb-5 border-b border-slate-100 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full">
          Candidate Portal
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">Sign In with Access Code</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Paste the unique code you were given during registration.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Your Access Code
            </label>
            <button
              type="button"
              onClick={handlePaste}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <ClipboardPaste className="w-3 h-3" />
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
              placeholder="e.g. KCSE-7842-9134"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base font-mono uppercase tracking-wider text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Tip: You can paste the code directly from your notes or saved messages.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            id="login-submit-btn"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
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

      <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-xs">
        <div className="flex items-center justify-between text-slate-500">
          <span>Don&apos;t have an access code?</span>
          <Link href="/register" className="font-bold text-emerald-700 hover:underline">
            Register & Get Code →
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
          <Link
            href="/admin/login"
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Administrator Login Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

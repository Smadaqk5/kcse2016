"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, ArrowRight, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

export function AdminLoginForm() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password) {
      setError("Please enter the administrator password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim() || "admin",
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid administrator credentials.");
        setLoading(false);
        return;
      }

      if (data.token) {
        try {
          localStorage.setItem("kcse_admin_token", data.token);
        } catch {}
      }

      setSuccess("Authentication verified! Opening Admin Dashboard...");
      setTimeout(() => {
        window.location.href = data.redirect || "/admin/dashboard";
      }, 250);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="text-center pb-5 border-b border-slate-100 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-0.5 rounded-full">
          Secure Administration
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">Admin Portal Sign In</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage revision materials, candidate access codes, and payments.
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

      <form onSubmit={handleAdminLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Admin Username / Email
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Admin Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-mono"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            id="admin-login-submit-btn"
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            {loading ? (
              <span>Verifying Credentials...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Sign In to Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <Link href="/login" className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Candidate Login</span>
        </Link>
        <Link href="/register" className="font-semibold text-emerald-700 hover:underline">
          Register Candidate
        </Link>
      </div>
    </div>
  );
}

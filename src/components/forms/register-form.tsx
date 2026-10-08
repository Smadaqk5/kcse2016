"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Copy, Check, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 2: Generated Access Code state
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setError("Please provide your phone number for M-Pesa access.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fullName.trim() || undefined,
          fullName: fullName.trim() || undefined,
          phone: cleanPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Please check your details.");
        return;
      }

      // Received unique access code!
      setGeneratedCode(data.accessCode);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!generatedCode) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(generatedCode);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = generatedCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function handleProceed() {
    if (generatedCode) {
      handleCopy();
    }
    router.push("/dashboard");
  }

  // Screen 2: Display unique access code
  if (generatedCode) {
    return (
      <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full">
            Account Ready
          </span>
          <h2 className="text-2xl font-black text-white mt-2">Your Unique Access Code</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Copy and save this code somewhere safe. This will be your permanent login detail to access the portal.
          </p>
        </div>

        {/* Big copyable code card */}
        <div className="rounded-2xl border-2 border-emerald-500/50 bg-slate-950 p-5 text-center space-y-3 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
            Candidate Login Code
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-emerald-300 select-all py-1">
            {generatedCode}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            id="copy-access-code-btn"
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              copied
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-slate-800 border border-slate-700 text-emerald-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-emerald-400" />
                <span>Copy Access Code</span>
              </>
            )}
          </button>
        </div>

        {/* Warning instructions */}
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 p-4 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">Save it in a safe place!</p>
            <p className="text-amber-200 leading-relaxed">
              Copy this code and save it in your notes, WhatsApp, or write it down. You will use it to sign in from any phone or computer.
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleProceed}
            id="continue-to-dashboard-btn"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer active:scale-98"
          >
            <span>I Have Saved It — Open Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-400 hover:text-white"
            >
              Test sign in with code →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Screen 1: Simple registration
  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl text-slate-100">
      <div className="text-center pb-5 border-b border-slate-800 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-md">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full">
          Candidate Registration
        </span>
        <h1 className="text-2xl font-black text-white mt-2">Get Your Access Code</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Enter your details below to generate your unique login code.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl border border-rose-800 bg-rose-950/60 text-xs text-rose-200 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Full Name or Nickname <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. John Kamau"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base sm:text-sm transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            M-Pesa Phone Number <span className="text-emerald-400">*</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712345678 or 254712345678"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base sm:text-sm font-mono transition"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Used for receiving M-Pesa STK prompts when unlocking examination papers.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            id="generate-code-submit-btn"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer active:scale-98"
          >
            {loading ? (
              <span>Generating Your Code...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Generate My Unique Access Code</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>Already have an access code?</span>
        <Link href="/login" className="font-bold text-emerald-400 hover:underline">
          Log In with Code →
        </Link>
      </div>
    </div>
  );
}

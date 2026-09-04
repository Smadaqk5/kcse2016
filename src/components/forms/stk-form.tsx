"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Zap,
  Lock,
} from "lucide-react";

export type PackageOption = {
  id: string;
  name: string;
  subscriptionType: "DAILY" | "WEEKLY" | "MONTHLY";
  amount: number;
  durationDays: number;
};

export function StkForm({
  compact = false,
  packages = [],
}: {
  compact?: boolean;
  packages?: PackageOption[];
}) {
  const router = useRouter();

  const defaultPackages: PackageOption[] = [
    { id: "daily", name: "Daily Access Pass", subscriptionType: "DAILY", amount: 1500, durationDays: 1 },
    { id: "weekly", name: "Weekly Exam Booster", subscriptionType: "WEEKLY", amount: 5000, durationDays: 7 },
    { id: "monthly", name: "Monthly VIP Pass", subscriptionType: "MONTHLY", amount: 12000, durationDays: 30 },
  ];

  const availablePackages = packages.length > 0 ? packages : defaultPackages;

  const [selectedPkg, setSelectedPkg] = useState<PackageOption>(
    availablePackages.find((p) => p.subscriptionType === "WEEKLY") || availablePackages[0]
  );
  const [phone, setPhone] = useState("07");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // STK Push state
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [isWaitingPrompt, setIsWaitingPrompt] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isSimulated, setIsSimulated] = useState(false);
  const [simulatingPin, setSimulatingPin] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll payment status while waiting
  useEffect(() => {
    if (!activePaymentId || !isWaitingPrompt) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/nestlink/status/${activePaymentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "SUCCESS") {
            setIsWaitingPrompt(false);
            setSuccess(`Payment confirmed! M-Pesa Receipt: ${data.receipt || "QA" + Date.now().toString().slice(-8)}`);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setTimeout(() => {
              router.refresh();
            }, 1200);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activePaymentId, isWaitingPrompt, router]);

  // Countdown timer for STK prompt
  useEffect(() => {
    if (!isWaitingPrompt) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsWaitingPrompt(false);
          setError("STK prompt timed out. Please try again.");
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isWaitingPrompt]);

  async function handleInitiateNestlink() {
    setError("");
    setSuccess("");

    const cleanPhone = phone.trim().replace(/[\s-]/g, "");
    if (!/^(\+?254|0)[17]\d{8}$/.test(cleanPhone)) {
      setError("Please enter a valid Kenyan Safaricom or Airtel mobile number (e.g. 0712345678).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/nestlink/stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          amount: selectedPkg.amount,
          packageId: selectedPkg.id,
          type: "SUBSCRIPTION",
          subscriptionType: selectedPkg.subscriptionType,
        }),
      });

      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (res.status === 401) {
        setError("Please enter your Access Code or sign in to purchase access.");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Payment initiation failed. Please try again.");
        return;
      }

      setActivePaymentId(data.paymentId);
      setIsSimulated(Boolean(data.isSimulated));

      if (data.autoActivated) {
        setSuccess(`Payment confirmed! Access activated.`);
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setIsWaitingPrompt(true);
        setCountdown(60);
      }
    } catch {
      setError("Network connection error. Please try again.");
      setLoading(false);
    }
  }

  // Simulate PIN approval in preview/test environment
  async function handleSimulateApproval() {
    if (!activePaymentId) return;
    setSimulatingPin(true);
    try {
      const res = await fetch("/api/payments/nestlink/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: activePaymentId }),
      });
      const data = await res.json();
      setSimulatingPin(false);
      if (res.ok) {
        setIsWaitingPrompt(false);
        setSuccess(`Payment confirmed! Receipt: ${data.receiptNumber || "MPESA-" + Date.now().toString().slice(-6)}. Your subscription is now ACTIVE.`);
        setTimeout(() => {
          router.refresh();
        }, 1200);
      } else {
        setError("Simulation failed: " + (data.error || "Unknown error"));
      }
    } catch {
      setSimulatingPin(false);
      setError("Failed to simulate confirmation.");
    }
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white ${compact ? "p-4 sm:p-5" : "p-6 sm:p-7"} shadow-sm`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              <Zap className="w-3 h-3 text-emerald-600" />
              Lipa na M-Pesa
            </span>
            <span className="text-xs font-medium text-slate-500">M-Pesa STK Push</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            Instant Subscription Activation
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>256-bit Encrypted Checkout</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* Package Selector */}
      {!isWaitingPrompt ? (
        <div className="mt-5 space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
            Select Revision Package
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {availablePackages.map((pkg) => {
              const isSelected = selectedPkg.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPkg(pkg)}
                  className={`text-left p-3.5 rounded-xl border transition-all relative ${
                    isSelected
                      ? "border-emerald-700 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-700"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  {pkg.subscriptionType === "WEEKLY" && (
                    <span className="absolute -top-2.5 right-3 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                  <p className="font-bold text-sm text-slate-900">{pkg.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{pkg.durationDays} Days Full Access</p>
                  <p className="text-lg font-extrabold text-emerald-800 mt-2">KES {pkg.amount}</p>
                </button>
              );
            })}
          </div>

          {/* M-Pesa Phone Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>M-Pesa Phone Number</span>
              <span className="text-[11px] font-normal text-slate-500">Safaricom / Airtel</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678 or 254712345678"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              A secure M-Pesa SIM prompt will appear directly on this phone.
            </p>
          </div>

          {/* Action button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleInitiateNestlink}
            className="w-full rounded-lg bg-emerald-700 py-3 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending M-Pesa Prompt...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                Pay KES {selectedPkg.amount} via Lipa na M-Pesa
              </>
            )}
          </button>
        </div>
      ) : (
        /* Waiting / STK Prompt Active State */
        <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-5 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-800">
            <Smartphone className="w-6 h-6 animate-pulse text-emerald-700" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h4 className="text-base font-bold text-slate-900">Check Your Phone</h4>
              {isSimulated && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                  Demo Sandbox
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
              An M-Pesa STK prompt for{" "}
              <span className="font-bold text-slate-800">KES {selectedPkg.amount}</span> to{" "}
              <span className="font-mono font-bold text-slate-800">{phone}</span>.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Clock className="w-3.5 h-3.5 text-emerald-700" />
            <span>Prompt expires in: {countdown}s</span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
            <p className="font-semibold text-slate-800">Instructions:</p>
            <p>1. Unlock your phone screen.</p>
            <p>2. Enter your secret M-Pesa PIN on the prompt.</p>
            <p>3. Wait 3 seconds — your access activates automatically.</p>
          </div>

          {/* Sandbox preview simulator button */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              disabled={simulatingPin}
              onClick={handleSimulateApproval}
              className="w-full rounded-lg bg-slate-900 py-2.5 px-3 text-xs font-bold text-white hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              {simulatingPin ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Simulating M-Pesa Confirmation...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  [Preview Demo] Simulate PIN Approval
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 mt-1">
              Test instant subscription activation without real M-Pesa deductions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  CheckCircle2,
  Smartphone,
  Sparkles,
  ShieldCheck,
  X,
  KeyRound,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface SinglePaperCheckoutProps {
  paper: {
    id: string;
    title: string;
    unitCode?: string | null;
    topic?: string | null;
    course?: string | null;
    semester?: string | null;
    price: number | string | { toString(): string };
  };
  hasAccess?: boolean;
}

export function SinglePaperCheckout({ paper, hasAccess = false }: SinglePaperCheckoutProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [phone, setPhone] = useState("07");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(hasAccess);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);
  const [activeTab, setActiveTab] = useState<"buy" | "restore">("buy");
  const [restorePhone, setRestorePhone] = useState("07");
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState("");

  const numPrice = Number(paper.price) || 250;

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    setStatusText("Initiating secure M-Pesa STK push...");

    try {
      const res = await fetch("/api/payments/nestlink/stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numPrice,
          phone: phone.trim(),
          type: "PAPER",
          paperId: paper.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate payment. Please verify phone number.");
      }

      setPaymentId(data.paymentId);
      setIsSimulated(Boolean(data.isSimulated));

      if (data.autoActivated) {
        setPaymentComplete(true);
        setStatusText("Payment verified automatically! Access unlocked.");
        setReceiptNumber("NL-INSTANT");
        setLoading(false);
        return;
      }

      setStatusText("M-Pesa STK push sent! Please enter your PIN on your phone to complete.");
      pollStatus(data.paymentId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error initiating checkout";
      setErrorMessage(message);
      setLoading(false);
    }
  };

  const pollStatus = (id: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(interval);
        setLoading(false);
        setStatusText("Request timed out. If you received an M-Pesa message, click 'Simulate Confirmation' or restore with phone.");
        return;
      }

      try {
        const res = await fetch(`/api/payments/nestlink/status/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "SUCCESS") {
            clearInterval(interval);
            setPaymentComplete(true);
            setReceiptNumber(data.receipt || "NL-APPROVED");
            setStatusText("Payment confirmed! Your paper is unlocked.");
            setLoading(false);
          } else if (data.status === "FAILED") {
            clearInterval(interval);
            setLoading(false);
            setErrorMessage("M-Pesa payment was cancelled or failed. Please try again.");
          }
        }
      } catch {
        // Continue polling
      }
    }, 2000);
  };

  const handleSimulateConfirm = async () => {
    if (!paymentId) return;
    setLoading(true);
    setStatusText("Simulating instant M-Pesa approval...");
    try {
      const res = await fetch("/api/payments/nestlink/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPaymentComplete(true);
        setReceiptNumber(data.receiptNumber || "NL-SIMULATED");
        setStatusText("Payment simulated successfully! Access unlocked.");
      } else {
        setErrorMessage(data.error || "Simulation failed.");
      }
    } catch {
      setErrorMessage("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreLoading(true);
    setRestoreMsg("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/papers/verify-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: restorePhone.trim(),
          paperId: paper.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.unlocked) {
        setPaymentComplete(true);
        setRestoreMsg("Verified! Your purchase was found. Opening paper...");
        setTimeout(() => {
          router.push(`/papers/${paper.id}/view?phone=${encodeURIComponent(restorePhone.trim())}`);
        }, 800);
      } else {
        setErrorMessage(data.error || "No active purchase found for this phone number.");
      }
    } catch {
      setErrorMessage("Failed to check access. Please check your network connection.");
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("buy");
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Buy Paper • KES {numPrice}</span>
        </button>

        <button
          type="button"
          onClick={() => router.push(`/papers/${paper.id}/view`)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          <span>View</span>
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 relative">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>No Account Required • Instant Access</span>
              </div>
              <h3 className="text-lg font-bold text-white leading-snug">{paper.title}</h3>
              <p className="text-xs text-slate-300 mt-1">
                {paper.unitCode || "KCSE"} {paper.topic ? `• ${paper.topic}` : ""}
              </p>
            </div>

            {/* Sub-tabs: Buy Single Paper vs Restore Previous Purchase */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("buy")}
                className={`flex-1 py-2.5 text-center transition-colors ${
                  activeTab === "buy"
                    ? "bg-white text-emerald-700 border-b-2 border-emerald-600 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Buy with M-Pesa (KES {numPrice})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("restore")}
                className={`flex-1 py-2.5 text-center transition-colors ${
                  activeTab === "restore"
                    ? "bg-white text-emerald-700 border-b-2 border-emerald-600 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Already Paid? Restore Access
              </button>
            </div>

            <div className="p-5">
              {paymentComplete ? (
                <div className="text-center py-4 space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Paper Unlocked!</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Your purchase is confirmed. You can now read, study, and view this paper directly.
                    </p>
                    {receiptNumber && (
                      <p className="text-xs font-mono text-slate-500 mt-2 bg-slate-100 p-1.5 rounded inline-block">
                        Receipt: {receiptNumber}
                      </p>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        router.push(`/papers/${paper.id}/view?phone=${encodeURIComponent(phone)}`);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition"
                    >
                      <span>Open Paper in Secure Viewer</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : activeTab === "buy" ? (
                <form onSubmit={handleInitiate} className="space-y-4">
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3.5 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Guest Checkout Guarantee</span>
                    </div>
                    <p className="text-emerald-700 leading-relaxed">
                      You do <strong>not</strong> need to register or sign in. Just provide your Safaricom M-Pesa number to pay KES {numPrice} and unlock this paper instantly.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Safaricom M-Pesa Phone Number
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07XXXXXXXX or 2547XXXXXXXX"
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-300 pl-9 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Format: 0712345678 or 254712345678
                    </p>
                  </div>

                  {statusText && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping mt-1" />
                      <span>{statusText}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 shadow transition disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing STK Push...</span>
                      </div>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span>Pay KES {numPrice} with M-Pesa</span>
                      </>
                    )}
                  </button>

                  {/* Status Verification / Simulation Helper */}
                  {paymentId && (
                    <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2">
                      {isSimulated ? (
                        <>
                          <p className="text-[11px] text-slate-500 text-center">
                            Development sandbox / Instant Test Mode:
                          </p>
                          <button
                            type="button"
                            onClick={handleSimulateConfirm}
                            disabled={!paymentId}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
                          >
                            ⚡ Simulate Instant M-Pesa Approval
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (paymentId) {
                              setStatusText("Checking live M-Pesa confirmation...");
                              fetch(`/api/payments/nestlink/status/${paymentId}`)
                                .then((res) => res.json())
                                .then((data) => {
                                  if (data.status === "SUCCESS") {
                                    setPaymentComplete(true);
                                    setReceiptNumber(data.receipt || "M-PESA-VERIFIED");
                                    setStatusText("Payment confirmed! Access unlocked.");
                                  } else {
                                    setStatusText("Payment still pending. Please enter your PIN on your phone.");
                                  }
                                })
                                .catch(() => setErrorMessage("Unable to verify payment status."));
                            }
                          }}
                          className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>I Have Entered PIN — Check Status</span>
                        </button>
                      )}
                    </div>
                  )}
                </form>
              ) : (
                /* Restore Access Tab */
                <form onSubmit={handleRestoreAccess} className="space-y-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <KeyRound className="w-4 h-4 text-slate-600" />
                      <span>Restore Previous Paper Purchase</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      If you previously bought this paper using your phone number, enter it below to restore your access instantly on this browser without signing up.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Phone Number Used at Checkout
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={restorePhone}
                        onChange={(e) => setRestorePhone(e.target.value)}
                        placeholder="07XXXXXXXX or 2547XXXXXXXX"
                        disabled={restoreLoading}
                        className="w-full rounded-xl border border-slate-300 pl-9 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                      />
                    </div>
                  </div>

                  {restoreMsg && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                      {restoreMsg}
                    </div>
                  )}

                  {errorMessage && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={restoreLoading}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 text-sm flex items-center justify-center gap-2 shadow transition disabled:opacity-50"
                  >
                    {restoreLoading ? "Checking Access..." : "Verify & Unlock Paper"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

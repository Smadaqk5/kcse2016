"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  BookOpen,
  Smartphone,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  Plus,
  RefreshCw,
  Lock,
} from "lucide-react";
import { useCart } from "@/lib/cart";

interface SuggestedPaper {
  id: string;
  title: string;
  unitCode: string;
  course: string;
  price: number;
}

interface ApiPaperItem {
  id: string;
  title: string;
  unitCode?: string | null;
  course?: string | null;
  price?: number | string;
}

export function CheckoutView() {
  const searchParams = useSearchParams();
  const paperIdFromQuery = searchParams.get("paperId");

  const { items, total, count, removeItem, clearCart, addItem, isInCart } = useCart();

  const [phone, setPhone] = useState("07");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [suggestedPapers, setSuggestedPapers] = useState<SuggestedPaper[]>([]);

  // Auto-fetch suggestions if cart is empty or to recommend additions
  useEffect(() => {
    let isMounted = true;
    async function loadSuggestions() {
      try {
        const res = await fetch("/api/papers");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.papers)) {
            setSuggestedPapers(
              data.papers.slice(0, 6).map((p: ApiPaperItem) => ({
                id: p.id,
                title: p.title,
                unitCode: p.unitCode || "KCSE",
                course: p.course || "National Exam",
                price: Number(p.price) || 250,
              }))
            );

            // If paperId provided in URL, auto-add it if available and not in cart
            if (paperIdFromQuery) {
              const matched = data.papers.find((p: ApiPaperItem) => p.id === paperIdFromQuery);
              if (matched && !isInCart(matched.id)) {
                addItem({
                  id: matched.id,
                  title: matched.title,
                  unitCode: matched.unitCode,
                  course: matched.course,
                  price: Number(matched.price) || 250,
                });
              }
            }
          }
        }
      } catch {
        // Non-blocking
      }
    }

    loadSuggestions();
    return () => {
      isMounted = false;
    };
  }, [paperIdFromQuery, isInCart, addItem]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMessage("Please add at least one examination paper to your cart to check out.");
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone.match(/^(?:254|\+254|0)?[17]\d{8}$/)) {
      setErrorMessage("Please enter a valid Kenyan Safaricom phone number (e.g. 0712345678 or 254712345678).");
      return;
    }

    setErrorMessage("");
    setLoading(true);
    setStatusText("Initiating Safaricom M-Pesa STK push for your cart...");

    try {
      const res = await fetch("/api/payments/nestlink/stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          phone: cleanPhone,
          type: "CART",
          paperIds: items.map((p) => p.id),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate M-Pesa checkout. Please check your phone number.");
      }

      setPaymentId(data.paymentId);
      setIsSimulated(Boolean(data.isSimulated));

      if (data.autoActivated) {
        setPaymentComplete(true);
        setStatusText("Payment verified! All papers in your cart are unlocked.");
        setReceiptNumber("NL-CART-INSTANT");
        if (data.accessCode) setAccessCode(data.accessCode);
        setLoading(false);
        return;
      }

      setStatusText("M-Pesa STK prompt sent to your phone! Please enter your PIN on your mobile device.");
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
        setStatusText("STK request timed out. If you confirmed the payment on your phone, click 'Check Status' below.");
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
            setStatusText("Payment confirmed! All cart papers have been unlocked.");
            setLoading(false);
          } else if (data.status === "FAILED") {
            clearInterval(interval);
            setLoading(false);
            setErrorMessage("M-Pesa transaction was cancelled or failed. Please try again.");
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
    setStatusText("Simulating instant M-Pesa payment confirmation...");
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
        setStatusText("Payment simulated successfully! All papers unlocked.");
      } else {
        setErrorMessage(data.error || "Simulation failed.");
      }
    } catch {
      setErrorMessage("Network error verifying simulation.");
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = async () => {
    if (!accessCode) return;
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Instant Candidate Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Cart &amp; Checkout
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review your selected examination papers and unlock them directly using M-Pesa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/papers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Browse More Papers</span>
          </Link>
          {count > 0 && !paymentComplete && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 hover:border-rose-900/60 bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>
      </div>

      {/* Guest Perks Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-800/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-slate-200">
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Guest Checkout Supported</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              You do <strong>not</strong> need to register or remember a password. Provide your phone number and papers unlock immediately upon payment.
            </p>
          </div>
        </div>

        <Link
          href="/pricing"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 shrink-0 inline-flex items-center gap-1"
        >
          <span>Need full access to all subjects? View VIP Plans</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Success State */}
      {paymentComplete ? (
        <div className="rounded-3xl bg-slate-900 border border-emerald-800/80 p-6 sm:p-10 text-center space-y-6 shadow-2xl animate-in fade-in">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-black text-white">Checkout Completed!</h2>
            <p className="text-sm text-emerald-300 font-semibold">
              M-Pesa Receipt: <span className="font-mono text-white">{receiptNumber}</span>
            </p>
            <p className="text-xs text-slate-300">
              Access has been activated for <span className="font-mono text-emerald-400 font-bold">{phone}</span>. You can now open and study all papers below in the secure viewer.
            </p>
          </div>

          {accessCode && (
            <div className="max-w-md mx-auto rounded-2xl bg-slate-950 border border-slate-800 p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Candidate Access Code:</span>
                <button
                  type="button"
                  onClick={copyCodeToClipboard}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                </button>
              </div>
              <div className="font-mono text-lg font-black text-emerald-400 tracking-wider">
                {accessCode}
              </div>
              <p className="text-[11px] text-slate-500">
                Save this code or your phone number to restore your examination materials at any time.
              </p>
            </div>
          )}

          {/* List of Unlocked Papers */}
          <div className="max-w-xl mx-auto space-y-3 pt-2 text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Unlocked Examination Papers ({items.length}):
            </h3>
            <div className="space-y-2">
              {items.map((paper) => (
                <div
                  key={paper.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {paper.unitCode || "KCSE"}
                      </span>
                      {paper.course && (
                        <span className="text-xs text-slate-400">{paper.course}</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{paper.title}</h4>
                  </div>

                  <Link
                    href={`/papers/${paper.id}/view?phone=${encodeURIComponent(phone)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shrink-0"
                  >
                    <span>Read Paper</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={clearCart}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Clear Cart
            </button>
            <Link
              href="/papers"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md"
            >
              Explore More Examination Papers
            </Link>
          </div>
        </div>
      ) : (
        /* Standard Cart & Checkout Flow */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-bold text-white text-base">Selected Papers</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {count} {count === 1 ? "paper" : "papers"}
                </span>
              </div>

              {count === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Your cart is currently empty</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You haven&apos;t added any examination papers yet. Pick from the catalog or select suggested papers below to begin checkout.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/papers"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Browse All Papers</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {item.unitCode || "KCSE"}
                          </span>
                          {item.course && (
                            <span className="text-xs text-slate-400 truncate">{item.course}</span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                        <span className="text-xs font-extrabold text-emerald-400">
                          KES {item.price}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition cursor-pointer"
                        title="Remove paper"
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Suggested Papers to Add */}
            {suggestedPapers.length > 0 && (
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Popular Examination Papers</span>
                  </h3>
                  <Link
                    href="/papers"
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    View All →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {suggestedPapers.map((paper) => {
                    const inCart = isInCart(paper.id);
                    return (
                      <div
                        key={paper.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[9px] font-bold text-slate-400 block truncate">
                            {paper.unitCode} • {paper.course}
                          </span>
                          <span className="text-xs font-bold text-white truncate block">
                            {paper.title}
                          </span>
                          <span className="text-[11px] font-extrabold text-emerald-400">
                            KES {paper.price}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (inCart) {
                              removeItem(paper.id);
                            } else {
                              addItem(paper);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                            inCart
                              ? "bg-slate-800 text-slate-300 hover:text-rose-400"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                          }`}
                        >
                          {inCart ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Checkout Summary & M-Pesa Payment Box */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-xl sticky top-20">
              <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal text-slate-400">Instant Access</span>
              </h2>

              {/* Cost Calculations */}
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Number of Papers:</span>
                  <span className="font-semibold text-slate-200">{count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Access Duration:</span>
                  <span className="font-semibold text-emerald-400">Permanent Study Access</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Processing Fee:</span>
                  <span className="font-semibold text-slate-200">KES 0.00 (Free)</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm sm:text-base font-bold text-white">
                  <span>Total Amount:</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-400">
                    KES {total}
                  </span>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="space-y-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Safaricom M-Pesa Phone Number <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712345678 or 2547..."
                      disabled={loading || count === 0}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    An automated STK push prompt will pop up on your handset.
                  </span>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
                    {errorMessage}
                  </div>
                )}

                {statusText && (
                  <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800 text-xs text-blue-200 flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping mt-1 shrink-0" />
                    <span>{statusText}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || count === 0}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-emerald-950 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Waiting for PIN on Phone...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Check Out • Pay KES {total} via M-Pesa</span>
                    </>
                  )}
                </button>

                {/* Instant Sandbox Simulation in Test/Dev */}
                {(isSimulated || process.env.NODE_ENV !== "production") && paymentId && !paymentComplete && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <button
                      type="button"
                      onClick={handleSimulateConfirm}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl border border-amber-600/60 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>⚡ Instant Test Mode: Simulate M-Pesa Approval</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center">
                      Allows instant verification without waiting for cellular STK response in development.
                    </p>
                  </div>
                )}
              </form>

              {/* Safe & Secure Guarantee */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct Safaricom Daraja &amp; Nestlink gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Immediate access without email registration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

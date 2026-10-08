"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  X,
  Trash2,
  BookOpen,
  Smartphone,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";
import { useCart } from "@/lib/cart";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, total, count, removeItem, clearCart } = useCart();

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

  const handleClose = () => {
    setErrorMessage("");
    setStatusText("");
    onClose();
  };

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setErrorMessage("");
    setLoading(true);
    setStatusText("Initiating M-Pesa STK push for your cart...");

    try {
      const res = await fetch("/api/payments/nestlink/stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          phone: phone.trim(),
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

      setStatusText("M-Pesa prompt sent to your phone! Please enter your PIN to complete.");
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
        setStatusText("Request timed out. If you paid on your phone, click 'Check Status' or contact support.");
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
            setStatusText("Payment confirmed! Your cart papers are unlocked.");
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
    setStatusText("Simulating instant M-Pesa payment approval...");
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
    <div className="fixed inset-0 z-[9990] flex justify-end bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="h-full w-full max-w-md bg-slate-900 border-l border-slate-800 p-4 sm:p-6 flex flex-col justify-between shadow-2xl text-slate-100 animate-in slide-in-from-right duration-200 overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                <ShoppingCart className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white leading-tight">Student Exam Cart</h3>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {count === 1 ? "1 paper added" : `${count} papers added`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Guest Perks Banner */}
          <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/60 p-3 flex items-center gap-2.5 text-xs text-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="leading-snug">
              <strong className="text-white">No account required.</strong> Add your papers and unlock them instantly via M-Pesa.
            </p>
          </div>

          {/* Success Screen after payment */}
          {paymentComplete ? (
            <div className="py-6 px-3 rounded-2xl bg-slate-950 border border-emerald-800/80 text-center space-y-4 animate-in fade-in">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Payment Confirmed!</h4>
                <p className="text-xs text-emerald-300 mt-1">
                  Receipt: <span className="font-mono font-bold text-white">{receiptNumber}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  All {count} papers in your cart are now unlocked for phone{" "}
                  <span className="font-mono text-emerald-400 font-semibold">{phone}</span>.
                </p>
              </div>

              {accessCode && (
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 text-left space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Your Candidate Access Code:</span>
                    <button
                      type="button"
                      onClick={copyCodeToClipboard}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <div className="font-mono text-base font-black text-emerald-400 tracking-wider">
                    {accessCode}
                  </div>
                </div>
              )}

              {/* Quick links to view unlocked papers */}
              <div className="space-y-2 pt-2 text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Unlocked Papers:
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {items.map((paper) => (
                    <Link
                      key={paper.id}
                      href={`/papers/${paper.id}/view`}
                      onClick={onClose}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs transition"
                    >
                      <div className="truncate">
                        <span className="font-bold text-white truncate block">{paper.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{paper.unitCode || "KCSE"}</span>
                      </div>
                      <span className="shrink-0 text-emerald-400 font-semibold flex items-center gap-1">
                        <span>Read</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Done &amp; Clear Cart
                </button>
              </div>
            </div>
          ) : count === 0 ? (
            /* Empty Cart View */
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-8 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-slate-500">
                <ShoppingCart className="h-7 w-7 text-emerald-500/60" />
              </div>
              <h4 className="text-base font-bold text-white">Your cart is empty</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Select any examination papers from the catalog and add them here to purchase directly with M-Pesa.
              </p>
              <div className="pt-2">
                <Link
                  href="/papers"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 text-xs transition shadow-md"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Browse Examination Papers</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Items List */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Selected Papers ({count})</span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-rose-400 hover:text-rose-300 font-medium transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[10px] font-bold text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {item.unitCode || "KCSE"}
                        </span>
                        {item.course && (
                          <span className="text-[10px] text-slate-400 truncate">
                            {item.course}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <span className="text-xs font-extrabold text-emerald-300">
                        KES {item.price}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition cursor-pointer shrink-0"
                      title="Remove from cart"
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Subtotal & Total */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Number of Papers:</span>
                  <span className="font-semibold text-slate-200">{count}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-white pt-1.5 border-t border-slate-800/80">
                  <span>Total Amount:</span>
                  <span className="text-base font-black text-emerald-400">KES {total}</span>
                </div>
              </div>

              {/* M-Pesa Checkout Form */}
              <form onSubmit={handleCheckout} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    M-Pesa Phone Number <span className="text-emerald-400">*</span>
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
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    An automated STK push prompt will pop up on this phone.
                  </span>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
                    {errorMessage}
                  </div>
                )}

                {statusText && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 animate-pulse">
                    {statusText}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || count === 0}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-emerald-950 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{loading ? "Processing..." : `Pay KES ${total} via M-Pesa`}</span>
                </button>

                {/* Direct Link to Dedicated Checkout Page */}
                <div className="pt-1 text-center">
                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <span>Open Dedicated Checkout Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Simulate Button in Test Environments */}
                {(isSimulated || process.env.NODE_ENV !== "production") && paymentId && !paymentComplete && (
                  <button
                    type="button"
                    onClick={handleSimulateConfirm}
                    disabled={loading}
                    className="w-full py-2 rounded-xl border border-amber-600/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 text-xs font-semibold transition cursor-pointer"
                  >
                    Simulate M-Pesa Payment Approval (Instant)
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Footer Links inside Drawer */}
        <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Digital Unlock</span>
            </span>
            <Link
              href="/pricing"
              onClick={onClose}
              className="text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              VIP Unlimited Passes →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

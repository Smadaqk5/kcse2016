import { Suspense } from "react";
import { Metadata } from "next";
import { CheckoutView } from "@/components/cart/checkout-view";

export const metadata: Metadata = {
  title: "Checkout - Student Examination Cart",
  description: "Secure M-Pesa checkout for selected KCSE examination papers. Instant unlock without creating an account.",
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Loading checkout details...</p>
          </div>
        }
      >
        <CheckoutView />
      </Suspense>
    </main>
  );
}

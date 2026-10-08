import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-slate-100">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Payment Received!</h1>
        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          Your M-Pesa payment is being verified by the automated gateway. Your access pass or single paper is activated automatically.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition"
          >
            <span>Go to Candidate Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/papers"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition"
          >
            <span>Browse Papers</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

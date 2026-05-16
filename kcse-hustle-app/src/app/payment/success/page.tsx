import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-8">
      <div className="rounded-xl border bg-white p-6">
      <h1 className="text-2xl font-bold">Payment Received</h1>
      <p className="mt-2 text-slate-600">
        Your M-Pesa payment is being verified. Access is activated automatically after callback confirmation.
      </p>
      <Link href="/dashboard" className="inline-block mt-4 rounded bg-slate-900 px-4 py-2 text-white">
        Go to Dashboard
      </Link>
      </div>
    </section>
  );
}

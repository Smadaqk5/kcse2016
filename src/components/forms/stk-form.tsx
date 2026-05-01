"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PackageOption = {
  id: string;
  name: string;
  subscriptionType: "DAILY" | "WEEKLY" | "MONTHLY";
  amount: number;
  durationDays: number;
};

export function StkForm({
  compact = false,
  packages,
}: {
  compact?: boolean;
  packages?: PackageOption[];
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("07");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function paySubscription(pkg: PackageOption) {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/payments/stk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        amount: pkg.amount,
        packageId: pkg.id,
        type: "SUBSCRIPTION",
        subscriptionType: pkg.subscriptionType,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 401) {
      setMessage("Login first to pay via STK push.");
      return;
    }
    setMessage(res.ok ? (data.message ?? "STK push sent. Complete payment on your phone.") : "Payment failed.");
    if (res.ok && !compact) router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <h3 className="font-semibold">Pay Subscription with Lipana STK Push</h3>
      <input className="w-full rounded-md border px-3 py-2" placeholder="07..., 01..., 2547..., 2541..., +2547..., +2541..." value={phone} onChange={(e) => setPhone(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        {(packages ?? []).map((pkg) => (
          <button
            key={pkg.id}
            disabled={loading}
            className="rounded bg-emerald-700 px-3 py-1.5 text-white"
            onClick={() => paySubscription(pkg)}
          >
            {pkg.name} - KES {pkg.amount}
          </button>
        ))}
      </div>
      {(!packages || packages.length === 0) && (
        <p className="text-sm text-amber-700">No active subscription packages available.</p>
      )}
      {message && <p className="text-sm text-slate-700">{message}</p>}
    </div>
  );
}

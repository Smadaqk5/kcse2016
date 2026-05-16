"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, phone, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registration failed.");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <input
        className="w-full rounded-md border px-3 py-2"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="w-full rounded-md border px-3 py-2"
        placeholder="Phone (07..., 01..., 2547..., 2541..., +2547..., +2541...)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        className="w-full rounded-md border px-3 py-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={loading}
        onClick={submit}
        className="w-full rounded-md bg-emerald-700 px-3 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </div>
  );
}

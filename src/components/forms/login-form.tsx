"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Invalid login details.");
      return;
    }
    const data = (await res.json()) as { ok?: boolean; redirect?: string };
    const path = typeof data.redirect === "string" ? data.redirect : "/dashboard";
    router.push(path);
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <input className="w-full rounded-md border px-3 py-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input className="w-full rounded-md border px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} onClick={submit} className="w-full rounded-md bg-slate-900 px-3 py-2 text-white disabled:opacity-60">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
}

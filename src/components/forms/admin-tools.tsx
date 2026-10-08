"use client";

import { useEffect, useState } from "react";

type SubscriptionType = "DAILY" | "WEEKLY" | "MONTHLY";
type PackageItem = {
  id: string;
  name: string;
  subscriptionType: SubscriptionType;
  amount: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
};

function getAdminAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("kcse_admin_token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export function AdminTools() {
  const [status, setStatus] = useState("");
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadPackages() {
    const res = await fetch("/api/admin/subscription-packages", {
      headers: { ...getAdminAuthHeaders() },
    });
    if (!res.ok) return;
    const data = await res.json();
    setPackages(
      data.map((p: PackageItem & { amount: string | number }) => ({
        ...p,
        amount: Number(p.amount),
      })),
    );
  }

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/subscription-packages", {
      headers: { ...getAdminAuthHeaders() },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Array<PackageItem & { amount: string | number }>) => {
        if (isMounted && Array.isArray(data)) {
          setPackages(
            data.map((p) => ({
              ...p,
              amount: Number(p.amount),
            })),
          );
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  async function createUser(formData: FormData) {
    const payload = {
      username: String(formData.get("username")),
      password: String(formData.get("password")),
      phone: String(formData.get("phone")),
    };
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    setStatus(res.ok ? "User created successfully." : "Failed to create user.");
  }

  async function uploadPaper(formData: FormData) {
    const res = await fetch("/api/admin/papers", {
      method: "POST",
      headers: {
        ...getAdminAuthHeaders(),
      },
      body: formData,
    });
    if (res.ok) {
      setStatus("Paper uploaded and published successfully! Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } else {
      const err = await res.json().catch(() => ({}));
      setStatus(`Paper upload failed: ${err.error || "Please check required fields"}`);
    }
  }

  async function createPackage(formData: FormData) {
    const payload = {
      name: String(formData.get("name")),
      subscriptionType: String(formData.get("subscriptionType")),
      amount: Number(formData.get("amount")),
      durationDays: Number(formData.get("durationDays")),
      sortOrder: Number(formData.get("sortOrder")),
      isActive: formData.get("isActive") === "on",
    };
    const res = await fetch("/api/admin/subscription-packages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    setStatus(res.ok ? "Subscription package added." : "Failed to add package.");
    if (res.ok) await loadPackages();
  }

  async function updatePackage(pkg: PackageItem) {
    const res = await fetch(`/api/admin/subscription-packages/${pkg.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify(pkg),
    });
    setStatus(res.ok ? "Package updated." : "Failed to update package.");
    if (res.ok) {
      setEditingId(null);
      await loadPackages();
    }
  }

  async function deletePackage(id: string) {
    const res = await fetch(`/api/admin/subscription-packages/${id}`, {
      method: "DELETE",
      headers: {
        ...getAdminAuthHeaders(),
      },
    });
    setStatus(res.ok ? "Package deleted." : "Failed to delete package.");
    if (res.ok) await loadPackages();
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 text-slate-100">
      <form action={createUser} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3 shadow-md">
        <h3 className="font-bold text-white text-base">Create Subscriber Account</h3>
        <input name="username" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Username" required />
        <input name="password" type="password" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Password" required />
        <input name="phone" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="07..., 01..., 2547..." required />
        <button className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer">Create User</button>
      </form>

      <form action={createPackage} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3 shadow-md">
        <h3 className="font-bold text-white text-base">Add Subscription Package</h3>
        <input name="name" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Package name" required />
        <select name="subscriptionType" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white" required>
          <option value="DAILY">DAILY</option>
          <option value="WEEKLY">WEEKLY</option>
          <option value="MONTHLY">MONTHLY</option>
        </select>
        <input name="amount" type="number" min={10} className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Amount (KES)" required />
        <input name="durationDays" type="number" min={1} className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Duration days" required />
        <input name="sortOrder" type="number" min={0} className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Sort order" defaultValue={0} required />
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input name="isActive" type="checkbox" defaultChecked className="rounded accent-emerald-600" /> Active package
        </label>
        <button className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer">Add Package</button>
      </form>

      <form action={uploadPaper} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3 shadow-md">
        <h3 className="font-bold text-white text-base">Upload Paper PDF</h3>
        <input name="title" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Title" required />
        <input name="unitCode" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Unit code (e.g. 121/1)" required />
        <input name="topic" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Topic" required />
        <input name="course" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Course / Subject" required />
        <input name="semester" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Year / Term" required />
        <input name="price" type="number" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500" placeholder="Single Price (KES)" required />
        <select name="contentType" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white">
          <option value="PAST_PAPER">Exam Paper</option>
          <option value="REVISION_NOTE">Study Guide</option>
          <option value="MOCK_EXAM">Mock Exam</option>
        </select>
        <input name="file" type="file" accept="application/pdf" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-slate-300" required />
        <button className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer">Upload PDF</button>
      </form>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 md:col-span-2 shadow-md">
        <h3 className="font-bold text-white text-base">Manage Subscription Packages</h3>
        {packages.map((pkg) => (
          <div key={pkg.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-3">
            <div className="grid gap-2 sm:grid-cols-5">
              <input
                className="rounded-lg bg-slate-900 border border-slate-750 px-3 py-1.5 text-xs text-white"
                value={pkg.name}
                onChange={(e) =>
                  setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, name: e.target.value } : p)))
                }
                disabled={editingId !== pkg.id}
              />
              <select
                className="rounded-lg bg-slate-900 border border-slate-750 px-3 py-1.5 text-xs text-white"
                value={pkg.subscriptionType}
                onChange={(e) =>
                  setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, subscriptionType: e.target.value as SubscriptionType } : p)))
                }
                disabled={editingId !== pkg.id}
              >
                <option value="DAILY">DAILY</option>
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
              </select>
              <input
                className="rounded-lg bg-slate-900 border border-slate-750 px-3 py-1.5 text-xs text-white"
                type="number"
                value={pkg.amount}
                onChange={(e) =>
                  setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, amount: Number(e.target.value) } : p)))
                }
                disabled={editingId !== pkg.id}
              />
              <input
                className="rounded-lg bg-slate-900 border border-slate-750 px-3 py-1.5 text-xs text-white"
                type="number"
                value={pkg.durationDays}
                onChange={(e) =>
                  setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, durationDays: Number(e.target.value) } : p)))
                }
                disabled={editingId !== pkg.id}
              />
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={pkg.isActive}
                  onChange={(e) =>
                    setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, isActive: e.target.checked } : p)))
                  }
                  disabled={editingId !== pkg.id}
                  className="accent-emerald-600"
                />
                Active
              </label>
            </div>
            <div className="flex gap-2">
              {editingId === pkg.id ? (
                <>
                  <button className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white cursor-pointer" onClick={() => void updatePackage(pkg)}>
                    Save
                  </button>
                  <button className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white cursor-pointer" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-200 cursor-pointer" onClick={() => setEditingId(pkg.id)}>
                  Edit
                </button>
              )}
              <button className="rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-200 px-3 py-1.5 text-xs font-semibold cursor-pointer" onClick={() => void deletePackage(pkg.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {status && <p className="md:col-span-2 text-xs font-semibold text-emerald-400 bg-slate-900 p-3 rounded-xl border border-slate-800">{status}</p>}
    </div>
  );
}

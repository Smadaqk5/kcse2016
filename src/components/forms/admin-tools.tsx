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

export function AdminTools() {
  const [status, setStatus] = useState("");
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadPackages() {
    const res = await fetch("/api/admin/subscription-packages");
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
    void loadPackages();
  }, []);

  async function createUser(formData: FormData) {
    const payload = {
      username: String(formData.get("username")),
      password: String(formData.get("password")),
      phone: String(formData.get("phone")),
    };
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setStatus(res.ok ? "User created successfully." : "Failed to create user.");
  }

  async function uploadPaper(formData: FormData) {
    const res = await fetch("/api/admin/papers", { method: "POST", body: formData });
    setStatus(res.ok ? "Paper uploaded." : "Paper upload failed.");
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setStatus(res.ok ? "Subscription package added." : "Failed to add package.");
    if (res.ok) await loadPackages();
  }

  async function updatePackage(pkg: PackageItem) {
    const res = await fetch(`/api/admin/subscription-packages/${pkg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
    });
    setStatus(res.ok ? "Package deleted." : "Failed to delete package.");
    if (res.ok) await loadPackages();
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form action={createUser} className="rounded-xl border bg-white p-4 space-y-2">
        <h3 className="font-semibold">Create Subscriber Account</h3>
        <input name="username" className="w-full rounded-md border px-3 py-2" placeholder="Username" required />
        <input name="password" type="password" className="w-full rounded-md border px-3 py-2" placeholder="Password" required />
        <input name="phone" className="w-full rounded-md border px-3 py-2" placeholder="07..., 01..., 2547..., 2541..., +2547..., +2541..." required />
        <button className="rounded bg-slate-900 px-3 py-1.5 text-white">Create User</button>
      </form>

      <form action={createPackage} className="rounded-xl border bg-white p-4 space-y-2">
        <h3 className="font-semibold">Add Subscription Package</h3>
        <input name="name" className="w-full rounded-md border px-3 py-2" placeholder="Package name" required />
        <select name="subscriptionType" className="w-full rounded-md border px-3 py-2" required>
          <option value="DAILY">DAILY</option>
          <option value="WEEKLY">WEEKLY</option>
          <option value="MONTHLY">MONTHLY</option>
        </select>
        <input name="amount" type="number" min={10} className="w-full rounded-md border px-3 py-2" placeholder="Amount (KES)" required />
        <input name="durationDays" type="number" min={1} className="w-full rounded-md border px-3 py-2" placeholder="Duration days" required />
        <input name="sortOrder" type="number" min={0} className="w-full rounded-md border px-3 py-2" placeholder="Sort order" defaultValue={0} required />
        <label className="flex items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked /> Active package
        </label>
        <button className="rounded bg-emerald-700 px-3 py-1.5 text-white">Add Package</button>
      </form>

      <form action={uploadPaper} className="rounded-xl border bg-white p-4 space-y-2">
        <h3 className="font-semibold">Upload Paper PDF</h3>
        <input name="title" className="w-full rounded-md border px-3 py-2" placeholder="Title" required />
        <input name="unitCode" className="w-full rounded-md border px-3 py-2" placeholder="Unit code" required />
        <input name="topic" className="w-full rounded-md border px-3 py-2" placeholder="Topic" required />
        <input name="course" className="w-full rounded-md border px-3 py-2" placeholder="Course" required />
        <input name="semester" className="w-full rounded-md border px-3 py-2" placeholder="Semester" required />
        <input name="price" type="number" className="w-full rounded-md border px-3 py-2" placeholder="Price" required />
        <select name="contentType" className="w-full rounded-md border px-3 py-2">
          <option value="PAST_PAPER">Past Paper</option>
          <option value="REVISION_NOTE">Revision Note</option>
          <option value="MOCK_EXAM">Mock Exam</option>
        </select>
        <input name="file" type="file" accept="application/pdf" className="w-full rounded-md border px-3 py-2" required />
        <button className="rounded bg-emerald-700 px-3 py-1.5 text-white">Upload PDF</button>
      </form>

      <div className="rounded-xl border bg-white p-4 space-y-3 md:col-span-2">
        <h3 className="font-semibold">Manage Subscription Packages</h3>
        {packages.map((pkg) => (
          <div key={pkg.id} className="rounded border p-3 space-y-2">
            <div className="grid gap-2 md:grid-cols-5">
              <input
                className="rounded border px-2 py-1"
                value={pkg.name}
                onChange={(e) =>
                  setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, name: e.target.value } : p)))
                }
                disabled={editingId !== pkg.id}
              />
              <select
                className="rounded border px-2 py-1"
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
                className="rounded border px-2 py-1"
                type="number"
                value={pkg.amount}
                onChange={(e) =>
                  setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, amount: Number(e.target.value) } : p)))
                }
                disabled={editingId !== pkg.id}
              />
              <input
                className="rounded border px-2 py-1"
                type="number"
                value={pkg.durationDays}
                onChange={(e) =>
                  setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, durationDays: Number(e.target.value) } : p)))
                }
                disabled={editingId !== pkg.id}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={pkg.isActive}
                  onChange={(e) =>
                    setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, isActive: e.target.checked } : p)))
                  }
                  disabled={editingId !== pkg.id}
                />
                Active
              </label>
            </div>
            <div className="flex gap-2">
              {editingId === pkg.id ? (
                <>
                  <button className="rounded bg-slate-900 px-3 py-1 text-white" onClick={() => void updatePackage(pkg)}>
                    Save
                  </button>
                  <button className="rounded border px-3 py-1" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="rounded border px-3 py-1" onClick={() => setEditingId(pkg.id)}>
                  Edit
                </button>
              )}
              <button className="rounded bg-red-600 px-3 py-1 text-white" onClick={() => void deletePackage(pkg.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {status && <p className="md:col-span-2 text-sm text-slate-700">{status}</p>}
    </div>
  );
}

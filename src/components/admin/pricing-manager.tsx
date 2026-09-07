"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Tag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Search,
  BookOpen,
  Layers,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  FileUp,
  X,
} from "lucide-react";

type SubscriptionType = "DAILY" | "WEEKLY" | "MONTHLY";

interface PackageItem {
  id: string;
  name: string;
  subscriptionType: SubscriptionType;
  amount: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
}

interface PaperItem {
  id: string;
  title: string;
  unitCode: string;
  topic: string;
  course: string;
  semester: string;
  price: number;
  contentType: "PAST_PAPER" | "REVISION_NOTE" | "MOCK_EXAM";
  isPublished: boolean;
}

function getAdminAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("kcse_admin_token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export function PricingManager() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [papers, setPapers] = useState<PaperItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable prices state
  const [packagePrices, setPackagePrices] = useState<Record<string, number>>({});
  const [paperPrices, setPaperPrices] = useState<Record<string, number>>({});

  // Status feedback
  const [savingPackageId, setSavingPackageId] = useState<string | null>(null);
  const [savingPaperId, setSavingPaperId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Paper filter & search
  const [paperSearch, setPaperSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PACKAGES" | "PAPERS">("ALL");

  // Bulk paper price
  const [bulkPrice, setBulkPrice] = useState<number>(50);
  const [savingBulk, setSavingBulk] = useState(false);

  // PDF Management (Add & Delete) state
  const [deletingPaperId, setDeletingPaperId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddPaperModal, setShowAddPaperModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUnitCode, setNewUnitCode] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newCourse, setNewCourse] = useState("KCSE");
  const [newSemester, setNewSemester] = useState("Term 1");
  const [newPrice, setNewPrice] = useState(50);
  const [newContentType, setNewContentType] = useState<"PAST_PAPER" | "REVISION_NOTE" | "MOCK_EXAM">("PAST_PAPER");
  const [newFile, setNewFile] = useState<File | null>(null);

  async function handleDeletePaper(paper: PaperItem) {
    setDeletingPaperId(paper.id);
    setErrorMessage(null);
    setConfirmDeleteId(null);

    try {
      const res = await fetch(`/api/admin/papers/${paper.id}`, {
        method: "DELETE",
        headers: {
          ...getAdminAuthHeaders(),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete paper");
      }

      setPapers((prev) => prev.filter((p) => p.id !== paper.id));
      setPaperPrices((prev) => {
        const copy = { ...prev };
        delete copy[paper.id];
        return copy;
      });

      triggerSuccess(`Paper "${paper.title}" was deleted permanently.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete paper";
      setErrorMessage(msg);
    } finally {
      setDeletingPaperId(null);
    }
  }

  async function handleAddPaper(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMessage("Please enter a title for the paper.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      const fd = new FormData();
      fd.append("title", newTitle.trim());
      fd.append("unitCode", newUnitCode.trim() || "101/1");
      fd.append("topic", newTopic.trim() || "General Revision");
      fd.append("course", newCourse.trim() || "KCSE");
      fd.append("semester", newSemester.trim() || "1");
      fd.append("price", String(newPrice));
      fd.append("contentType", newContentType);
      if (newFile) {
        fd.append("file", newFile);
      }

      const res = await fetch("/api/admin/papers", {
        method: "POST",
        headers: {
          ...getAdminAuthHeaders(),
        },
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload paper");
      }

      const created: PaperItem = await res.json();
      setPapers((prev) => [created, ...prev]);
      setPaperPrices((prev) => ({
        ...prev,
        [created.id]: Number(created.price),
      }));

      triggerSuccess(`New paper "${created.title}" uploaded & added successfully!`);
      // Reset form
      setNewTitle("");
      setNewUnitCode("");
      setNewTopic("");
      setNewPrice(50);
      setNewFile(null);
      setShowAddPaperModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload paper";
      setErrorMessage(msg);
    } finally {
      setUploading(false);
    }
  }

  function refreshPricingData() {
    setLoading(true);
    fetch("/api/admin/pricing", {
      headers: {
        ...getAdminAuthHeaders(),
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const pkgs: PackageItem[] = (data.packages || []).map((p: PackageItem & { amount: string | number }) => ({
            ...p,
            amount: Number(p.amount),
          }));
          const pps: PaperItem[] = (data.papers || []).map((p: PaperItem & { price: string | number }) => ({
            ...p,
            price: Number(p.price),
          }));

          setPackages(pkgs);
          setPapers(pps);

          const pkgMap: Record<string, number> = {};
          pkgs.forEach((p) => {
            pkgMap[p.id] = p.amount;
          });
          setPackagePrices(pkgMap);

          const ppsMap: Record<string, number> = {};
          pps.forEach((p) => {
            ppsMap[p.id] = p.price;
          });
          setPaperPrices(ppsMap);
        }
      })
      .catch(() => {
        setErrorMessage("Could not load pricing data. Check network.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/pricing", {
      headers: {
        ...getAdminAuthHeaders(),
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const pkgs: PackageItem[] = (data.packages || []).map((p: PackageItem & { amount: string | number }) => ({
          ...p,
          amount: Number(p.amount),
        }));
        const pps: PaperItem[] = (data.papers || []).map((p: PaperItem & { price: string | number }) => ({
          ...p,
          price: Number(p.price),
        }));

        setPackages(pkgs);
        setPapers(pps);

        const pkgMap: Record<string, number> = {};
        pkgs.forEach((p) => {
          pkgMap[p.id] = p.amount;
        });
        setPackagePrices(pkgMap);

        const ppsMap: Record<string, number> = {};
        pps.forEach((p) => {
          ppsMap[p.id] = p.price;
        });
        setPaperPrices(ppsMap);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("Could not load pricing data. Check network.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function triggerSuccess(msg: string) {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  }

  async function handleSavePackagePrice(pkg: PackageItem) {
    const newPrice = packagePrices[pkg.id];
    if (newPrice === undefined || isNaN(newPrice) || newPrice < 10) {
      setErrorMessage(`Please enter a valid package price (minimum 10 KES) for ${pkg.name}.`);
      return;
    }

    setSavingPackageId(pkg.id);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          target: "PACKAGE",
          id: pkg.id,
          price: Number(newPrice),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update package price");
      }

      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, amount: Number(newPrice) } : p))
      );
      triggerSuccess(`Updated ${pkg.name} price to KES ${newPrice} successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving price";
      setErrorMessage(msg);
    } finally {
      setSavingPackageId(null);
    }
  }

  async function handleSavePaperPrice(paper: PaperItem) {
    const newPrice = paperPrices[paper.id];
    if (newPrice === undefined || isNaN(newPrice) || newPrice < 0) {
      setErrorMessage(`Please enter a valid price for ${paper.title}.`);
      return;
    }

    setSavingPaperId(paper.id);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          target: "PAPER",
          id: paper.id,
          price: Number(newPrice),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update paper price");
      }

      setPapers((prev) =>
        prev.map((p) => (p.id === paper.id ? { ...p, price: Number(newPrice) } : p))
      );
      triggerSuccess(`Updated ${paper.unitCode} (${paper.title.slice(0, 30)}...) price to KES ${newPrice}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving paper price";
      setErrorMessage(msg);
    } finally {
      setSavingPaperId(null);
    }
  }

  async function handleApplyBulkPaperPrice() {
    if (isNaN(bulkPrice) || bulkPrice < 0) {
      setErrorMessage("Enter a valid bulk price.");
      return;
    }

    setSavingBulk(true);
    setErrorMessage(null);

    try {
      const payload = {
        papers: papers.map((p) => ({ id: p.id, price: Number(bulkPrice) })),
      };

      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Bulk price update failed");
      }

      setPapers((prev) => prev.map((p) => ({ ...p, price: Number(bulkPrice) })));
      const ppsMap: Record<string, number> = {};
      papers.forEach((p) => {
        ppsMap[p.id] = Number(bulkPrice);
      });
      setPaperPrices(ppsMap);

      triggerSuccess(`Updated all ${papers.length} exam papers to KES ${bulkPrice}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error during bulk update";
      setErrorMessage(msg);
    } finally {
      setSavingBulk(false);
    }
  }

  const filteredPapers = useMemo(() => {
    if (!paperSearch.trim()) return papers;
    const term = paperSearch.toLowerCase();
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.unitCode.toLowerCase().includes(term) ||
        p.topic.toLowerCase().includes(term)
    );
  }, [papers, paperSearch]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Price &amp; Tariff Management</h2>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                Admin Control
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Directly adjust subscription pass fees and individual exam paper prices. Changes sync immediately to M-Pesa STK push.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Filter */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All Prices
            </button>
            <button
              onClick={() => setActiveTab("PACKAGES")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "PACKAGES" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Subscriptions ({packages.length})
            </button>
            <button
              onClick={() => setActiveTab("PAPERS")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "PAPERS" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Papers ({papers.length})
            </button>
          </div>

          <button
            onClick={refreshPricingData}
            disabled={loading}
            title="Refresh prices"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-900 font-medium">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: Subscription Packages Pricing */}
      {(activeTab === "ALL" || activeTab === "PACKAGES") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-900">Subscription Package Rates</h3>
            </div>
            <span className="text-[11px] text-slate-500">
              Controls candidate pricing on the public <span className="font-mono">/pricing</span> page
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const currentEditVal = packagePrices[pkg.id] ?? pkg.amount;
              const hasChanged = currentEditVal !== pkg.amount;
              const isSaving = savingPackageId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className={`rounded-xl border p-4 transition-all relative ${
                    hasChanged
                      ? "border-emerald-600 bg-emerald-50/20 shadow-sm"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                        {pkg.subscriptionType}
                      </span>
                      <h4 className="mt-1 font-bold text-sm text-slate-900">{pkg.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        Duration: {pkg.durationDays} {pkg.durationDays === 1 ? "day" : "days"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Current</span>
                      <span className="font-black text-slate-900 text-sm">
                        KES {pkg.amount}
                      </span>
                    </div>
                  </div>

                  {/* Price input & action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        KES
                      </span>
                      <input
                        type="number"
                        min={10}
                        step={10}
                        value={currentEditVal}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPackagePrices((prev) => ({ ...prev, [pkg.id]: val }));
                        }}
                        className="w-full rounded-lg border border-slate-200 py-1.5 pl-11 pr-2 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    {/* Quick increment buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPackagePrices((prev) => ({
                            ...prev,
                            [pkg.id]: Math.max(10, (prev[pkg.id] ?? pkg.amount) - 10),
                          }));
                        }}
                        className="rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                        title="-10 KES"
                      >
                        -10
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPackagePrices((prev) => ({
                            ...prev,
                            [pkg.id]: (prev[pkg.id] ?? pkg.amount) + 50,
                          }));
                        }}
                        className="rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                        title="+50 KES"
                      >
                        +50
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSavePackagePrice(pkg)}
                      disabled={isSaving || !hasChanged}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                        hasChanged
                          ? "bg-emerald-700 text-white hover:bg-emerald-800"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {isSaving ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : hasChanged ? (
                        <Save className="h-3.5 w-3.5" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      {isSaving ? "Saving" : hasChanged ? "Save" : "Saved"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: Individual Exam Papers & Mocks Pricing */}
      {(activeTab === "ALL" || activeTab === "PAPERS") && (
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-900">Exam Papers &amp; PDF Management</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {filteredPapers.length} Papers
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Upload PDF Button */}
              <button
                type="button"
                onClick={() => setShowAddPaperModal((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-sm transition-colors"
              >
                {showAddPaperModal ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{showAddPaperModal ? "Close Upload Form" : "Upload / Add New PDF"}</span>
              </button>

              {/* Quick Bulk Price Setter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                <span className="text-[11px] text-slate-500 whitespace-nowrap pl-1">Set all:</span>
                <div className="relative w-20">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                    KES
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(Number(e.target.value))}
                    className="w-full rounded border border-slate-200 py-0.5 pl-8 pr-1 text-xs font-semibold focus:border-emerald-600 focus:outline-none bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyBulkPaperPrice}
                  disabled={savingBulk || papers.length === 0}
                  className="rounded bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {savingBulk ? "..." : "Apply"}
                </button>
              </div>
            </div>
          </div>

          {/* Add / Upload PDF Paper Panel */}
          {showAddPaperModal && (
            <form
              onSubmit={handleAddPaper}
              className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-5 space-y-4 animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-emerald-700" />
                  <h4 className="text-sm font-bold text-slate-900">Upload &amp; Add New Exam Paper PDF</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPaperModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Paper Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KCSE 2025 Mathematics Paper 1 National Mock & Scheme"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject / Unit Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 121/1 or 101/2"
                    value={newUnitCode}
                    onChange={(e) => setNewUnitCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject / Topic *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics or English"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Content Type
                  </label>
                  <select
                    value={newContentType}
                    onChange={(e) => setNewContentType(e.target.value as "PAST_PAPER" | "REVISION_NOTE" | "MOCK_EXAM")}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PAST_PAPER">Past Paper</option>
                    <option value="MOCK_EXAM">Predicted Mock Exam</option>
                    <option value="REVISION_NOTE">Revision Note / Summary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price (KES) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Level / Course
                  </label>
                  <input
                    type="text"
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    placeholder="e.g. KCSE"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Term / Semester
                  </label>
                  <input
                    type="text"
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value)}
                    placeholder="e.g. Term 1, Mocks"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PDF Document File (Optional - Auto-generates watermarked template if omitted)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setNewFile(file);
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPaperModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white flex items-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading &amp; Publishing...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Upload &amp; Publish Paper</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code (121/1), subject, or topic..."
              value={paperSearch}
              onChange={(e) => setPaperSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Papers Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Code / Unit</th>
                  <th className="py-2.5 px-3">Paper Title &amp; Topic</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Current Price</th>
                  <th className="py-2.5 px-3">New Price (KES)</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPapers.map((paper) => {
                  const currentEditVal = paperPrices[paper.id] ?? paper.price;
                  const hasChanged = currentEditVal !== paper.price;
                  const isSaving = savingPaperId === paper.id;

                  return (
                    <tr
                      key={paper.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        hasChanged ? "bg-emerald-50/20" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {paper.unitCode}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <p className="font-semibold text-slate-900 truncate" title={paper.title}>
                          {paper.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{paper.topic}</p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            paper.contentType === "MOCK_EXAM"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {paper.contentType === "MOCK_EXAM" ? "PREDICTED MOCK" : "PAST PAPER"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-700">
                        KES {paper.price}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="relative w-24">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                              KES
                            </span>
                            <input
                              type="number"
                              min={0}
                              step={10}
                              value={currentEditVal}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setPaperPrices((prev) => ({ ...prev, [paper.id]: val }));
                              }}
                              className={`w-full rounded border py-1 pl-8 pr-1.5 text-xs font-bold focus:outline-none ${
                                hasChanged
                                  ? "border-emerald-600 bg-white text-emerald-950 ring-1 ring-emerald-500"
                                  : "border-slate-200 text-slate-900"
                              }`}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setPaperPrices((prev) => ({
                                ...prev,
                                [paper.id]: Math.max(0, (prev[paper.id] ?? paper.price) - 10),
                              }));
                            }}
                            className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                            title="-10 KES"
                          >
                            -10
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaperPrices((prev) => ({
                                ...prev,
                                [paper.id]: (prev[paper.id] ?? paper.price) + 20,
                              }));
                            }}
                            className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                            title="+20 KES"
                          >
                            +20
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview PDF in new tab */}
                          <a
                            href={`/api/papers/${paper.id}/stream`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors"
                            title="Preview PDF document"
                          >
                            <ExternalLink className="h-3 w-3 text-slate-500" />
                            <span className="hidden sm:inline">Preview</span>
                          </a>

                          {/* Save Price Button */}
                          <button
                            type="button"
                            onClick={() => handleSavePaperPrice(paper)}
                            disabled={isSaving || !hasChanged}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                              hasChanged
                                ? "bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {isSaving ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : hasChanged ? (
                              <Save className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            {isSaving ? "Saving" : hasChanged ? "Save Price" : "Current"}
                          </button>

                          {/* Delete Paper Button */}
                          {confirmDeleteId === paper.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeletePaper(paper)}
                                disabled={deletingPaperId === paper.id}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs font-bold shadow-sm transition-colors"
                                title="Click to permanently delete paper"
                              >
                                {deletingPaperId === paper.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                <span>Delete?</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="inline-flex items-center justify-center h-6 w-6 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 text-xs font-bold"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(paper.id)}
                              disabled={deletingPaperId === paper.id}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                              title={`Delete ${paper.title}`}
                            >
                              {deletingPaperId === paper.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredPapers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No papers matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

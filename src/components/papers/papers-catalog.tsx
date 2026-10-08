"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  BookOpen,
  Filter,
  ArrowUpDown,
  RotateCcw,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { SinglePaperCheckout } from "@/components/papers/single-paper-checkout";
import { useCart } from "@/lib/cart";

export interface CatalogPaper {
  id: string;
  title: string;
  description?: string | null;
  contentType: string;
  unitCode: string;
  topic: string;
  course: string;
  semester: string;
  price: number;
  filePath?: string;
  isPublished?: boolean;
  createdAt: string;
}

interface PapersCatalogProps {
  papers: CatalogPaper[];
  accessMap: Record<string, boolean>;
  dbOffline?: boolean;
}

type SortOption = "newest" | "title" | "unitCode" | "price-asc" | "price-desc";

export function PapersCatalog({
  papers,
  accessMap,
  dbOffline = false,
}: PapersCatalogProps) {
  const { count: cartCount, total: cartTotal, openCart } = useCart();
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        return url.searchParams.get("q") || "";
      } catch {}
    }
    return "";
  });
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract unique subjects from papers
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    papers.forEach((p) => {
      if (p.course && p.course.trim().length > 0) {
        set.add(p.course.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [papers]);

  // Global keyboard shortcut to focus search input (e.g. '/' or 'Ctrl+K')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
          setSearchQuery("");
        }
        return;
      }
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter and sort papers
  const filteredPapers = useMemo(() => {
    let result = papers;

    // Filter by Subject chip if selected
    if (selectedSubject !== "all") {
      result = result.filter(
        (p) => (p.course || "").toLowerCase() === selectedSubject.toLowerCase()
      );
    }

    // Filter by search query (Title, Subject, or Unit Code)
    const rawQuery = searchQuery.trim().toLowerCase();
    if (rawQuery.length > 0) {
      const terms = rawQuery.split(/\s+/).filter(Boolean);

      result = result.filter((paper) => {
        const title = (paper.title || "").toLowerCase();
        const subject = (paper.course || "").toLowerCase();
        const unitCode = (paper.unitCode || "").toLowerCase();
        const topic = (paper.topic || "").toLowerCase();
        const description = (paper.description || "").toLowerCase();

        const searchableText = `${title} ${subject} ${unitCode} ${topic} ${description}`;
        return terms.every((term) => searchableText.includes(term));
      });
    }

    // Sort papers
    return [...result].sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "unitCode") {
        return (a.unitCode || "").localeCompare(b.unitCode || "");
      }
      if (sortBy === "price-asc") {
        return a.price - b.price;
      }
      if (sortBy === "price-desc") {
        return b.price - a.price;
      }
      return 0;
    });
  }, [papers, searchQuery, selectedSubject, sortBy]);

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedSubject !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSubject("all");
    setSortBy("newest");
    searchInputRef.current?.focus();
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Search and Filter Control Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-emerald-400" />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject (e.g. Mathematics, English), or unit code (e.g. 121/1)..."
              className="w-full pl-10 pr-24 py-3 bg-slate-950 rounded-xl border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-base sm:text-sm text-white placeholder:text-slate-400 transition"
              autoComplete="off"
              spellCheck={false}
            />

            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
              {searchQuery.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 select-none shadow-xs">
                  <span>/</span>
                </kbd>
              )}
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ArrowUpDown className="w-4 h-4 text-emerald-400" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-48 pl-9 pr-8 py-3 bg-slate-950 rounded-xl border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer transition"
                aria-label="Sort examination papers"
              >
                <option value="newest" className="bg-slate-900 text-white">Latest Added</option>
                <option value="title" className="bg-slate-900 text-white">Title (A-Z)</option>
                <option value="unitCode" className="bg-slate-900 text-white">Unit Code (A-Z)</option>
                <option value="price-asc" className="bg-slate-900 text-white">Price (Low to High)</option>
                <option value="price-desc" className="bg-slate-900 text-white">Price (High to Low)</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition shrink-0 cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Subject Chips Filter */}
        {availableSubjects.length > 0 && (
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-medium text-slate-400 shrink-0 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" /> Subject:
            </span>

            <button
              type="button"
              onClick={() => setSelectedSubject("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 cursor-pointer ${
                selectedSubject === "all"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              All Subjects ({papers.length})
            </button>

            {availableSubjects.map((subject) => {
              const count = papers.filter(
                (p) => (p.course || "").toLowerCase() === subject.toLowerCase()
              ).length;
              const isSelected = selectedSubject.toLowerCase() === subject.toLowerCase();

              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() =>
                    setSelectedSubject(isSelected ? "all" : subject)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{subject}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isSelected
                        ? "bg-emerald-800 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Header / Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="text-xs sm:text-sm text-slate-400">
          Showing <span className="font-bold text-white">{filteredPapers.length}</span> of{" "}
          <span className="font-semibold text-slate-300">{papers.length}</span> examination papers
          {hasActiveFilters && (
            <span className="text-emerald-400 font-medium ml-1.5">
              (Filtered{searchQuery.trim() ? ` by "${searchQuery.trim()}"` : ""}
              {selectedSubject !== "all" ? ` in ${selectedSubject}` : ""})
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline self-start sm:self-auto cursor-pointer"
          >
            Clear active filters
          </button>
        )}
      </div>

      {/* Offline Alert */}
      {dbOffline && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-amber-200 text-sm">
          Database is temporarily unreachable. Examination papers will be loaded once the connection recovers.
        </div>
      )}

      {/* Papers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPapers.map((paper) => {
          const hasAccess = Boolean(accessMap[paper.id]);

          return (
            <article
              key={paper.id}
              className="group flex flex-col justify-between rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-5 shadow-md hover:shadow-emerald-950/20 transition-all relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-slate-950 px-2.5 py-0.5 text-xs font-bold font-mono text-emerald-400 border border-slate-800">
                      {paper.unitCode || "KCSE"}
                    </span>
                    {paper.course && (
                      <span className="inline-flex items-center rounded-md bg-emerald-950/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-800/60">
                        {paper.course}
                      </span>
                    )}
                  </div>

                  {hasAccess && (
                    <span className="inline-flex items-center rounded-md bg-emerald-900/60 border border-emerald-700/60 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                      Unlocked
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors line-clamp-2 mt-1">
                  {paper.title}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-1">
                  {paper.topic || "General Examination"} {paper.semester ? `• Year ${paper.semester}` : ""}
                </p>

                {paper.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {paper.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Price
                  </span>
                  <span className="text-sm sm:text-base font-black text-white">
                    KES {String(paper.price)}
                  </span>
                </div>

                <SinglePaperCheckout
                  paper={{
                    id: paper.id,
                    title: paper.title,
                    unitCode: paper.unitCode,
                    topic: paper.topic,
                    course: paper.course,
                    semester: paper.semester,
                    price: Number(paper.price),
                  }}
                  hasAccess={hasAccess}
                />
              </div>
            </article>
          );
        })}

        {/* Empty State when no results match search/filter */}
        {!dbOffline && filteredPapers.length === 0 && papers.length > 0 && (
          <div className="col-span-full rounded-2xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white">
              No examination papers match your search
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-md mx-auto">
              We couldn&apos;t find any papers matching{" "}
              {searchQuery.trim() ? (
                <span className="font-semibold text-emerald-400">&quot;{searchQuery}&quot;</span>
              ) : (
                "the selected filters"
              )}
              . Try searching by subject (e.g. Mathematics, English), unit code (e.g. 121, 101), or paper title.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs sm:text-sm font-semibold shadow-md transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Search &amp; Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State when database has 0 papers */}
        {!dbOffline && papers.length === 0 && (
          <div className="col-span-full rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="font-medium text-white">No examination papers available yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Please check back shortly as the controller uploads examination papers.
            </p>
          </div>
        )}
      </div>

      {/* Sticky Cart Floating Bar for Guest Students */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] max-w-lg animate-in slide-in-from-bottom-4 duration-200">
          <div className="rounded-2xl bg-slate-900/98 border border-emerald-500/80 p-3 sm:p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-white ring-1 ring-emerald-500/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-emerald-400 block">
                  {cartCount === 1 ? "1 Paper in Cart" : `${cartCount} Papers in Cart`}
                </span>
                <span className="text-sm sm:text-base font-black text-white">
                  Total: KES {cartTotal}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={openCart}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 text-xs sm:text-sm shadow-md shadow-emerald-950 transition active:scale-95 cursor-pointer shrink-0"
            >
              <span>View Cart &amp; Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

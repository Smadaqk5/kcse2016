"use client";

import { useEffect, useMemo, useState } from "react";

export function PaperViewer({
  paperId,
  username,
  phone,
}: {
  paperId: string;
  username: string;
  phone: string;
}) {
  const [hidden, setHidden] = useState(false);
  const displayUsername = username || "KCSE Candidate";
  const displayPhone = phone || "Guest";
  const watermark = useMemo(
    () => `${displayUsername} | ${displayPhone} | ${new Date().toLocaleDateString()}`,
    [displayPhone, displayUsername],
  );

  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        void fetch("/api/activity/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "BLOCKED_SHORTCUT", details: e.key }),
        });
      }
      if (e.key === "PrintScreen") e.preventDefault();
    };
    const onVisibility = () => {
      setHidden(document.hidden);
      if (document.hidden) {
        void fetch("/api/activity/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "TAB_HIDDEN", details: "Viewer tab out of focus" }),
        });
      }
    };
    document.addEventListener("contextmenu", prevent);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("contextmenu", prevent);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const streamSrc = `/api/papers/${paperId}/stream?phone=${encodeURIComponent(phone || "")}#toolbar=0&navpanes=0`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs sm:text-sm text-amber-900">
        <span>Protected KCSE Material. Watermarked for: <strong>{displayPhone}</strong></span>
        <span className="text-amber-700">Screenshots & redistribution prohibited</span>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center opacity-15 text-lg sm:text-2xl font-bold rotate-[-15deg] select-none text-white pointer-events-none">
          {watermark}
        </div>
        <iframe
          src={streamSrc}
          className={`h-[78vh] w-full border-0 bg-white ${hidden ? "blur-md" : ""}`}
        />
      </div>
    </div>
  );
}

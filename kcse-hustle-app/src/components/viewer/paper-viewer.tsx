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
  const watermark = useMemo(
    () => `${username} | ${phone} | ${new Date().toLocaleString()}`,
    [phone, username],
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

  return (
    <div className="space-y-3">
      <p className="rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900">
        Screenshots, copying and redistribution prohibited.
      </p>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center opacity-20 text-xl font-bold rotate-[-15deg]">
          {watermark}
        </div>
        <iframe
          src={`/api/papers/${paperId}/stream#toolbar=0&navpanes=0`}
          className={`h-[75vh] w-full rounded-lg border ${hidden ? "blur-sm" : ""}`}
        />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { KeyRound, Check, Copy } from "lucide-react";

export function CopyCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy your Access Code"
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1 text-xs font-mono font-bold transition-colors cursor-pointer"
    >
      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
      <span>Code: {code}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600" />
      ) : (
        <Copy className="w-3 h-3 text-slate-400" />
      )}
    </button>
  );
}

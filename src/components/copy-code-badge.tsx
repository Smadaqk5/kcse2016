"use client";

import { useState } from "react";
import { KeyRound, Check, Copy } from "lucide-react";

export function CopyCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy your Access Code"
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-700 px-3 py-1 text-xs font-mono font-bold transition-colors cursor-pointer"
    >
      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
      <span>Code: {code}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400" />
      ) : (
        <Copy className="w-3 h-3 text-slate-400" />
      )}
    </button>
  );
}

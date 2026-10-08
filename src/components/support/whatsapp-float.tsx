"use client";

import { useState } from "react";
import { MessageCircle, Phone, Copy, Check, X } from "lucide-react";

export function WhatsAppFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rawNumber = "+14144015805";
  const waUrl = "https://wa.me/14144015805?text=Hello%20KCSE%20Support%2C%20I%20need%20help%20with%20my%20exam%20papers%20and%20access%20code.";

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(rawNumber);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = rawNumber;
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
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[9990] flex flex-col items-end gap-2 max-w-full">
      {/* Quick popup card */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] max-w-sm sm:w-80 rounded-2xl border border-slate-800 bg-slate-900/98 p-4 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 text-slate-100 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-md">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">KCSE 2026 Support</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online on WhatsApp</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="py-3 text-xs text-slate-300 space-y-1.5">
            <p className="font-semibold text-white">Need help with payments or access codes?</p>
            <p className="text-slate-400 leading-relaxed">
              Our 24/7 support line is available directly on WhatsApp.
            </p>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5 flex items-center justify-between mt-2">
              <span className="font-mono text-xs font-bold text-emerald-400">{rawNumber}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-white bg-slate-850 hover:bg-slate-800 px-2 py-1 rounded-md border border-slate-700 transition cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 text-xs font-bold shadow-md shadow-emerald-950 transition active:scale-98"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href={`tel:${rawNumber}`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 text-xs font-bold transition"
              title="Call Support"
            >
              <Phone className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 shadow-xl shadow-emerald-950 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
        aria-label="Open WhatsApp Support"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <MessageCircle className="h-5 w-5 fill-white/20" />
        <span className="text-xs sm:text-sm font-bold tracking-wide">
          WhatsApp Support
        </span>
      </button>
    </div>
  );
}

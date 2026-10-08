"use client";

import { useState } from "react";
import {
  MessageCircle,
  Phone,
  Mail,
  Send,
  Copy,
  Check,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const whatsappNumber = "+14144015805";
  const rawNumberOnly = "14144015805";
  const whatsappUrl = `https://wa.me/${rawNumberOnly}?text=Hello%20KCSE%20Support%2C%20I%20need%20assistance%20with%20exam%20papers%20or%20my%20access%20code.`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(whatsappNumber);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = whatsappNumber;
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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How do I get my Access Code after paying via M-Pesa?",
      a: "Once you enter your M-Pesa PIN on your phone, your unique 12-character Access Code is automatically generated and displayed on your screen. You can also restore access anytime using the phone number you paid with.",
    },
    {
      q: "Can I pay using another phone number?",
      a: "Yes! At checkout or in the pricing subscription form, enter the exact phone number with the M-Pesa balance. The STK push will be sent to that handset, and your access will be activated.",
    },
    {
      q: "Why are screenshots and printing blocked?",
      a: "All KCSE examination papers and marking schemes are copyrighted materials protected under security protocol to maintain academic integrity. Content is watermarked for your specific session.",
    },
    {
      q: "How fast does WhatsApp support respond?",
      a: "Our WhatsApp support desk (+14144015805) is monitored 24/7 during examination periods. Most inquiries regarding access codes and paper activation are answered within 5 minutes.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-800/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dedicated Candidate Helpdesk</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Contact &amp; Support
          </h1>
          <p className="text-slate-400 text-xs sm:text-base leading-relaxed">
            Need help with M-Pesa checkout, your candidate access code, or single paper viewing? Our support team is here to help.
          </p>
        </div>

        {/* Primary Contact Card: Official WhatsApp Support */}
        <div className="rounded-2xl border-2 border-emerald-500/60 bg-slate-900/95 p-5 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
            Primary Channel
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/50 shrink-0">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    WhatsApp Candidate Support
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>Online 24/7 • Instant Response</span>
                  </div>
                </div>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                Chat directly with our verification desk on WhatsApp for instant assistance with payments, paper unlocking, or manual activation.
              </p>

              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm">
                <span className="text-xs text-slate-400">Support Line:</span>
                <span className="font-mono font-bold text-emerald-300 text-sm sm:text-base">
                  {whatsappNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-2 inline-flex items-center gap-1 rounded-lg bg-slate-850 px-2 py-1 text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-800 transition cursor-pointer"
                  title="Copy Phone Number"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Mobile-Friendly Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white px-5 py-3.5 text-sm font-bold shadow-lg shadow-emerald-950 transition min-h-[48px]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat on WhatsApp</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>

              <a
                href={`tel:${whatsappNumber}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-3 text-xs sm:text-sm font-semibold transition min-h-[44px]"
              >
                <Phone className="h-4 w-4 text-emerald-400" />
                <span>Call +14144015805</span>
              </a>
            </div>
          </div>
        </div>

        {/* Secondary Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Telegram Support Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-950 border border-sky-800 text-sky-400 flex items-center justify-center shrink-0">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Telegram Helpdesk</h3>
                  <p className="text-xs text-slate-400">Direct candidate assistance</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reach our secondary support channel on Telegram for queries regarding papers or marking schemes.
              </p>
            </div>
            <a
              href="https://t.me/kcse_support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 text-xs font-semibold transition"
            >
              <span>Open Telegram Desk</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>

          {/* Email Support Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Official Email Desk</h3>
                  <p className="text-xs text-slate-400">Formal inquiries and verifications</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send payment receipts or institutional inquiries to our official desk.
              </p>
            </div>
            <a
              href="mailto:support@kcsepapers.co.ke"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 text-xs font-semibold transition"
            >
              <span>support@kcsepapers.co.ke</span>
              <Mail className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base sm:text-lg text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-200 hover:text-emerald-400 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? "rotate-180 text-emerald-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-slate-400 border-t border-slate-850 pt-3 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

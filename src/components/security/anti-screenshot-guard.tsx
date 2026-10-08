"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AlertTriangle } from "lucide-react";

export function AntiScreenshotGuard() {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showSecurityNotice = useCallback((msg: string) => {
    setWarningMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 3000);
  }, []);

  useEffect(() => {
    // Clear clipboard if user attempts screenshot or print screen
    const clearClipboardContent = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(
            "Protected KCSE Examination Material - Reproduction prohibited."
          );
        }
      } catch {
        // Silently catch clipboard permission restrictions
      }
    };

    // Detect keyboard shortcuts used for screenshotting, printing, inspecting, and saving
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // PrintScreen key (standard Windows / Linux)
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        void clearClipboardContent();
        showSecurityNotice("Screenshots are strictly disabled on this portal.");
        return;
      }

      // Print shortcut: Ctrl+P / Cmd+P
      if (isCtrlOrCmd && key === "p") {
        e.preventDefault();
        showSecurityNotice("Printing is prohibited for protected exam materials.");
        return;
      }

      // Save page shortcut: Ctrl+S / Cmd+S
      if (isCtrlOrCmd && key === "s") {
        e.preventDefault();
        showSecurityNotice("Saving portal pages locally is restricted.");
        return;
      }

      // View source: Ctrl+U / Cmd+U
      if (isCtrlOrCmd && key === "u") {
        e.preventDefault();
        showSecurityNotice("Source code viewing is disabled.");
        return;
      }

      // Snipping tool / Screenshot combinations: Ctrl+Shift+S / Cmd+Shift+S / Cmd+Shift+3 / 4
      if (isCtrlOrCmd && e.shiftKey && (key === "s" || key === "3" || key === "4")) {
        e.preventDefault();
        void clearClipboardContent();
        showSecurityNotice("Screen capture shortcuts are restricted.");
        return;
      }

      // Developer Tools: F12 or Ctrl+Shift+I / Cmd+Option+I / Ctrl+Shift+C
      if (
        e.key === "F12" ||
        (isCtrlOrCmd && e.shiftKey && (key === "i" || key === "c" || key === "j"))
      ) {
        e.preventDefault();
        showSecurityNotice("Developer tools access is disabled on this portal.");
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        void clearClipboardContent();
      }
    };

    // Disable context menu (right-click) except inside editable text inputs
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return; // Allow typing helpers inside form fields
      }
      e.preventDefault();
      showSecurityNotice("Right-click is disabled to protect examination content.");
    };

    // Disable drag & drop of images or content
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA")
      ) {
        return;
      }
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("dragstart", handleDragStart);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("dragstart", handleDragStart);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [showSecurityNotice]);

  return (
    <>
      {/* Security Toast Warning for Blocked Attempts */}
      {warningMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99998] pointer-events-none flex items-center gap-3 rounded-xl bg-slate-900/95 border border-amber-500/50 px-4 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-md transition-all animate-bounce"
        >
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}
    </>
  );
}

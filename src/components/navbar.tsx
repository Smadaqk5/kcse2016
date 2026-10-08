"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  MessageCircle,
  ShieldCheck,
  BookOpen,
  KeyRound,
  FileText,
  DollarSign,
  PhoneCall,
  User,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "@/components/cart/cart-drawer";

const links = [
  { href: "/", label: "Home", icon: BookOpen },
  { href: "/papers", label: "Papers", icon: FileText },
  { href: "/checkout", label: "Checkout", icon: ShoppingCart },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/dashboard", label: "Dashboard", icon: User },
  { href: "/login", label: "Login", icon: KeyRound },
  { href: "/register", label: "Register", icon: ShieldCheck },
  { href: "/contact", label: "Contact", icon: PhoneCall },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState("");
  const { count: cartCount } = useCart();

  useEffect(() => {
    const handleOpenCart = () => setCartDrawerOpen(true);
    window.addEventListener("kcse_cart_open", handleOpenCart);
    return () => window.removeEventListener("kcse_cart_open", handleOpenCart);
  }, []);

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setCartDrawerOpen(false);
    setQuickSearchOpen(false);
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearchQuery.trim()) {
      router.push(`/papers?q=${encodeURIComponent(quickSearchQuery.trim())}`);
      closeAllMenus();
      setQuickSearchQuery("");
    } else {
      router.push("/papers");
      closeAllMenus();
    }
  };

  return (
    <header className="sticky top-0 z-50 shadow-lg shadow-black/40">
      {/* Top Banner Navigation Bar */}
      <div className="border-b border-emerald-900/50 bg-slate-950/95 backdrop-blur-md text-white transition-colors">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              onClick={closeAllMenus}
              className="group flex items-center gap-2 font-sans text-base sm:text-xl font-black tracking-tight text-white hover:text-emerald-400 transition"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white shadow-md shadow-emerald-900/50 group-hover:scale-105 transition">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight font-extrabold text-white group-hover:text-emerald-300">
                  KCSE Exam Portal
                </span>
                <span className="text-[10px] text-emerald-400 font-medium tracking-wide">
                  KCSE 2026 VIP
                </span>
              </div>
            </Link>

            <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Verified Materials
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <ul className="hidden lg:flex list-none items-center justify-end gap-1.5 xl:gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeAllMenus}
                    className={`inline-flex items-center px-3 py-2 text-xs xl:text-sm font-semibold rounded-lg transition-all duration-150 ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-950/60"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right Header Action Icons & Mobile Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Icon Button */}
            <button
              type="button"
              onClick={() => {
                if (pathname === "/papers") {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement | null;
                  input?.focus();
                } else {
                  setQuickSearchOpen(!quickSearchOpen);
                }
              }}
              className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 hover:text-emerald-400 hover:bg-slate-800 transition active:scale-95 cursor-pointer"
              title="Search Examination Papers"
              aria-label="Search examination papers"
            >
              <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </button>

            {/* Shopping Cart / Papers Badge Button */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(!cartDrawerOpen)}
              className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 hover:text-emerald-400 hover:bg-slate-800 transition active:scale-95 cursor-pointer"
              title="Saved Papers / Cart"
              aria-label="Saved papers or cart"
            >
              <ShoppingCart className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                {cartCount}
              </span>
            </button>

            {/* WhatsApp Quick Button (Desktop & Tablet) - Logo only */}
            <a
              href="https://wa.me/14144015805?text=Hello%20KCSE%20Support%2C%20I%20need%20assistance"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 hover:border-emerald-500 text-emerald-400 hover:text-white transition active:scale-95 shadow-sm cursor-pointer"
              title="WhatsApp Support (+14144015805)"
              aria-label="WhatsApp Support"
            >
              <MessageCircle className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </a>

            {/* The Three Bar (Hamburger Menu Button) */}
            <button
              type="button"
              id="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition active:scale-95 cursor-pointer select-none"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-emerald-400" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6 text-slate-200" aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>

        {/* Quick Search Dropdown Bar (when Search icon is toggled) */}
        {quickSearchOpen && (
          <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 shadow-2xl animate-in slide-in-from-top-2 duration-150">
            <form
              onSubmit={handleQuickSearchSubmit}
              className="mx-auto flex max-w-2xl items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  placeholder="Search papers by subject, title or code (e.g. Mathematics, 121/1)..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setQuickSearchOpen(false)}
                className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Cart Drawer for Guest Students */}
        <CartDrawer
          isOpen={cartDrawerOpen}
          onClose={() => setCartDrawerOpen(false)}
        />

        {/* Mobile Dropdown Menu (Opened by the Three Bar Hamburger Button) */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-drawer"
            className="lg:hidden border-t border-slate-800 bg-slate-950/98 px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-150"
          >
            {/* Quick search input inside mobile drawer */}
            <form onSubmit={handleQuickSearchSubmit} className="relative pb-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                placeholder="Search subject or paper code..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </form>

            {/* Navigation links grid */}
            <div className="grid grid-cols-1 gap-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeAllMenus}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition active:scale-98 ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-emerald-400"}`} />
                      <span>{link.label}</span>
                    </div>
                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Direct WhatsApp Support Button inside Drawer */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <a
                href="https://wa.me/14144015805?text=Hello%20KCSE%20Support%2C%20I%20need%20assistance%20with%20exam%20papers"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeAllMenus}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 text-sm font-bold shadow-lg shadow-emerald-950 transition active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Support (+14144015805)</span>
              </a>

              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                <span>Fast M-Pesa Verification</span>
                <span className="text-emerald-400 font-semibold">24/7 Desk Active</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

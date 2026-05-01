"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/papers", label: "Papers" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
  { href: "/contact", label: "Contact" },
];

const linkBase =
  "inline-flex items-center justify-center min-h-10 rounded-lg px-3.5 sm:px-4 text-sm sm:text-[0.9375rem] font-medium font-sans transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 shadow-sm shadow-black/15">
      <div className="border-b border-emerald-900/25 bg-[var(--portal-green)] text-white">
        <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 lg:px-8 lg:py-4">
          <Link
            href="/"
            className="font-sans text-lg font-bold tracking-tight text-white sm:text-xl shrink-0 hover:text-white/95"
          >
            KCSE 2026
          </Link>
          <ul className="flex list-none flex-wrap items-center justify-start gap-2 sm:justify-end sm:gap-2.5 lg:gap-3">
            {links.map((link) => {
              const isActive = pathname === link.href;
              let className = linkBase;
              if (isActive) {
                className += " bg-white text-neutral-900 shadow-sm ring-1 ring-black/5";
              } else {
                className +=
                  " text-white/95 hover:bg-white/15 hover:text-white active:bg-white/20";
              }
              return (
                <li key={link.href}>
                  <Link href={link.href} className={className}>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <div className="portal-divider" />
      <div className="portal-divider" />
    </header>
  );
}

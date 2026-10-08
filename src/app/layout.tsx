import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AntiScreenshotGuard } from "@/components/security/anti-screenshot-guard";
import { WhatsAppFloat } from "@/components/support/whatsapp-float";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KCSE Exam Portal - Official Exam Papers",
  description: "Secure VIP exam papers and study materials platform with view-only subscription access and M-Pesa payments.",
  openGraph: {
    title: "KCSE Exam Portal - Official Exam Papers",
    description: "Secure VIP exam papers and study materials platform with view-only subscription access and M-Pesa payments.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#090d16] text-slate-100 dark"
      >
        <AntiScreenshotGuard />
        <Navbar />
        <main className="w-full flex-1">{children}</main>
        <WhatsAppFloat />
        <Footer />
      </body>
    </html>
  );
}

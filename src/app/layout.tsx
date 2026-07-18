import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XAU/USD Decisive Trade Plan — Aggressive Execution",
  description:
    "Full no-compromise top-down analysis of XAU/USD using market structure, supply & demand, liquidity, BOS/CHoCH, candlestick confirmation, and chart-pattern validation. Single decisive trade plan with exact Entry, Stop Loss, and Take Profit.",
  keywords: [
    "XAU/USD",
    "Gold",
    "Trading",
    "Price Action",
    "Market Structure",
    "Smart Money Concepts",
    "BOS",
    "CHoCH",
    "Supply and Demand",
    "Liquidity",
    "Candlestick",
    "Chart Patterns",
  ],
  authors: [{ name: "Z.ai Trading Analysis" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "XAU/USD Decisive Trade Plan",
    description: "Top-down price-action analysis with exact Entry, Stop Loss, and Take Profit.",
    url: "https://chat.z.ai",
    siteName: "Z.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "XAU/USD Decisive Trade Plan",
    description: "Top-down price-action analysis with exact Entry, Stop Loss, and Take Profit.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

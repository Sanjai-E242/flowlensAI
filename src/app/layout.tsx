import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/frontend/hooks/useTheme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowLens AI — Process Intelligence & Bottleneck Detection",
  description:
    "Upload a process event log, pinpoint the bottleneck with deterministic analytics, simulate interventions with the What-If engine, and get executive explanations powered by Gemini AI.",
  keywords: [
    "process mining",
    "bottleneck detection",
    "what-if simulation",
    "Gemini AI",
    "process intelligence",
    "event log analysis",
    "Next.js",
    "Supabase",
  ],
  authors: [{ name: "FlowLens AI" }],
  openGraph: {
    title: "FlowLens AI — Process Intelligence & Bottleneck Detection",
    description:
      "Deterministic process mining + Gemini AI explanations. Find bottlenecks, simulate interventions, predict migration.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowLens AI",
    description:
      "Deterministic process mining + Gemini AI explanations. Find bottlenecks, simulate interventions, predict migration.",
  },
  robots: {
    index: true,
    follow: true,
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500/25 selection:text-cyan-900 dark:selection:text-cyan-200 transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { MobileTabBar } from "@/components/MobileTabBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScrapExchange — live scrap metal prices",
  description:
    "Live scrap metal prices, instant quotes, and a portfolio-style dashboard for tracking your sales — Sharesies for scrap metal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-950 text-stone-50">
        <AuthProvider>
          <AppProvider>
            <Nav />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-24 sm:px-6 sm:pb-8">
              {children}
            </main>
            <MobileTabBar />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

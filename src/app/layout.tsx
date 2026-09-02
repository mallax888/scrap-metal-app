import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { CelebrationProvider } from "@/components/ui/Celebration";
import { ToastProvider } from "@/components/ui/Toast";
import { LitchiProvider } from "@/lib/store";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-litchi-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Update if a custom domain replaces the default deployment URL — needed to
  // resolve absolute URLs for the generated social share image.
  metadataBase: new URL("https://litchi-app.vercel.app"),
  title: {
    default: "Litchi — Move in. Pay smarter.",
    template: "%s · Litchi",
  },
  description:
    "Litchi pays your rental bond up front and you repay it in fixed weekly payments. Track your bond, payments, rewards and renter score in one place.",
  applicationName: "Litchi",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#17110e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-NZ"
      className={`${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved theme before first paint, so the page never
            flashes light before switching to dark. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-canvas text-ink">
        <LitchiProvider>
          <ToastProvider>
            <CelebrationProvider>
              <AppShell>{children}</AppShell>
            </CelebrationProvider>
          </ToastProvider>
        </LitchiProvider>
      </body>
    </html>
  );
}

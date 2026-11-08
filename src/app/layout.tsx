import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/noto-sans-devanagari/devanagari-400.css";
import "@fontsource/noto-sans-devanagari/devanagari-500.css";
import "@fontsource/noto-sans-devanagari/devanagari-600.css";
import { THEME_SCRIPT } from "@/components/theme-toggle";
import { getLang } from "@/lib/i18n";
import "./globals.css";


export const metadata: Metadata = {
  title: { default: "Rooftop Solar — Check, Quote, Track", template: "%s · Rooftop Solar" },
  description: "Find out if rooftop solar suits your home, get a quote with subsidy and payback, and track installation.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0e" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={await getLang()} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

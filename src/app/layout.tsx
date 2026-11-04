import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Rooftop Solar — Check, Quote, Track", template: "%s · Rooftop Solar" },
  description: "Find out if rooftop solar suits your home, get a quote with subsidy and payback, and track installation.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fafaf7" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${devanagari.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

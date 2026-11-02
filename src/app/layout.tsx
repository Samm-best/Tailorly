import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Tailorly", template: "%s | Tailorly" },
  description: "Your Tailoring Business, Digitally Connected.",
  icons: {
    icon: "/brand/tailorly-mark.png",
    apple: "/brand/tailorly-mark.png",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#173D78" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased"><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}

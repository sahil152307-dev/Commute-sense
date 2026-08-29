import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CommuteIQ — Smart Urban Transit Intelligence",
  description: "AI-Powered Smart Transit System for SIH 2026. Computer vision crowd analytics, predictive ETA, multi-modal routing, fleet dispatching, and driver safety monitoring.",
  keywords: ["CommuteIQ", "SIH 2026", "Smart Transit", "AI Transportation", "Fleet Management"],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  );
}
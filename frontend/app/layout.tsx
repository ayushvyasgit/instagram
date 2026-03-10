import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import ReduxProvider from "@/src/store/ReduxProvider";

export const metadata: Metadata = {
  title: {
    default: "Instagram Clone",
    template: "%s | Instagram Clone",
  },
  description: "A sleek, modern Instagram-inspired social platform.",
  keywords: ["social", "instagram", "clone"],
  authors: [{ name: "Ayush Vyas" }],
  creator: "Ayush Vyas",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Instagram Clone",
    title: "Instagram Clone",
    description: "A sleek, modern Instagram-inspired social platform.",
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
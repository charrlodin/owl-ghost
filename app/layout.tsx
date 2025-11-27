import Script from "next/script";
import type { Metadata } from "next";
import { Syne, Manrope } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "800"], // Extra bold for that "art" look
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OwlGhost",
  description: "Simple, privacy-friendly file sharing.",
  icons: {
    icon: "/icon.png",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          defer
          src="https://umami-three-wheat-87.vercel.app/script.js"
          data-website-id="fab7b427-3542-473e-ae0f-f33d597afe24"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${syne.variable} ${manrope.variable} antialiased bg-background text-foreground`}
      >
        <ClerkProvider dynamic>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

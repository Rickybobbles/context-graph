import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DialRoot } from "dialkit";
import { Agentation } from "agentation";
import "dialkit/styles.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Context Graph — The Underwriting Journey",
  description: "Where decisions happen in real estate investing — and how few are ever recorded.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">
        {children}
        <DialRoot position="top-right" />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}

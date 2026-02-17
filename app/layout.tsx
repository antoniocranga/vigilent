// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vigilent - Monitorizare AI pentru achizițiile publice",
  description: "Detectăm automat potențiale nereguli în achizițiile publice din România folosind inteligență artificială.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
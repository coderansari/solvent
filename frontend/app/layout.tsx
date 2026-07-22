import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "../lib/wallet";
import SmoothScroll from "../components/SmoothScroll";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Solvent — Confidential Proof of Solvency",
  description:
    "Prove reserves ≥ liabilities on-chain without revealing the numbers. Built on iExec Nox.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <SmoothScroll>
          <WalletProvider>{children}</WalletProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}

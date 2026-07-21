import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "../lib/wallet";

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
    <html lang="en">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}

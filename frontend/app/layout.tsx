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
  metadataBase: new URL("https://solvent.vercel.app"),
  title: {
    default: "Solvent",
    template: "%s · Solvent",
  },
  description:
    "Solvent proves reserves ≥ liabilities on-chain while every amount stays encrypted. The comparison runs inside an iExec Nox TEE, and only the boolean verdict is published.",
  keywords: ["proof of solvency", "proof of reserves", "confidential DeFi", "iExec Nox", "TEE", "zero-knowledge", "Ethereum"],
  openGraph: {
    title: "Solvent · Confidential Proof of Solvency",
    description:
      "Confidential proof of solvency on iExec Nox. Reserves ≥ liabilities, verified in a TEE, amounts never revealed.",
    images: ["/logo.png"],
    type: "website",
  },
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
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

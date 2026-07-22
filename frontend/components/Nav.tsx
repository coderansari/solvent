"use client";

import { motion } from "framer-motion";
import { useWallet } from "../lib/wallet";
import { deployed } from "../lib/contracts";
import { short } from "../lib/config";

function roleOf(address: string | null): string {
  if (!address) return "";
  const a = address.toLowerCase();
  if (deployed.operator && a === deployed.operator.toLowerCase()) return "operator";
  if (deployed.auditor && a === deployed.auditor.toLowerCase()) return "auditor";
  return "customer";
}

export default function Nav() {
  const { address, onSepolia, connect, connecting } = useWallet();

  return (
    <motion.nav
      className="nav-inner"
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <a href="#top" className="brand">
        <span className="mark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="10" width="16" height="10" rx="2.5" fill="currentColor" />
            <path
              d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        Solvent
      </a>

      <div className="topbar-right">
        <span className={`pill ${onSepolia ? "ok" : "bad"}`}>
          <span className="live" /> {onSepolia ? "Sepolia" : "Wrong network"}
        </span>
        {address ? (
          <span className="pill">
            <span className="role-badge">{roleOf(address)}</span> · {short(address)}
          </span>
        ) : (
          <button className="btn primary" onClick={connect} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </motion.nav>
  );
}

"use client";

import { useWallet } from "../../lib/wallet";
import { short } from "../../lib/config";
import { IcoChain } from "./icons";

export default function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { address, onSepolia, connect, connecting, switchToSepolia } = useWallet();

  return (
    <header className="dash-topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <div className="top-spacer" />

      {onSepolia ? (
        <span className="pill" style={{ height: 42, padding: "0 14px" }}>
          <IcoChain size={16} />
          Sepolia
          <span className="live" style={{ color: "var(--emerald)" }} />
        </span>
      ) : (
        <button className="pill" onClick={switchToSepolia} style={{ height: 42, padding: "0 14px" }}>
          <IcoChain size={16} />
          Switch to Sepolia
          <span className="live" style={{ color: "var(--rose)" }} />
        </button>
      )}

      {address ? (
        <span className="pill" style={{ height: 42, padding: "0 14px" }}>
          <span className="wallet-dot" style={{ width: 22, height: 22 }} />
          <span className="mono">{short(address)}</span>
        </span>
      ) : (
        <button className="btn primary" onClick={connect} disabled={connecting}>
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
      )}
    </header>
  );
}

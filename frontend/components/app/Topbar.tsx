"use client";

import { useWallet } from "../../lib/wallet";
import { short } from "../../lib/config";
import { IcoSearch, IcoBell, IcoChain } from "./icons";

export default function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { address, onSepolia, connect, connecting, switchToSepolia } = useWallet();

  return (
    <header className="dash-topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      <div className="search">
        <IcoSearch size={18} />
        <input placeholder="Search proofs, vaults, addresses…" />
        <span className="kbd">⌘K</span>
      </div>

      <div className="top-spacer" />

      <button
        className="pill"
        onClick={onSepolia ? undefined : switchToSepolia}
        style={{ cursor: onSepolia ? "default" : "pointer", height: 42, padding: "0 14px" }}
      >
        <IcoChain size={16} />
        {onSepolia ? "Sepolia" : "Switch network"}
        <span className="live" style={{ color: onSepolia ? "var(--emerald)" : "var(--rose)" }} />
      </button>

      <button className="icon-btn">
        <IcoBell size={19} />
      </button>

      {address ? (
        <span className="pill" style={{ height: 42, padding: "0 14px" }}>
          <span className="wallet-dot" style={{ width: 22, height: 22 }} />
          <span className="mono">{short(address)}</span>
        </span>
      ) : (
        <button className="btn primary" onClick={connect} disabled={connecting}>
          {connecting ? "Connecting…" : "Connect Wallet"}
        </button>
      )}
    </header>
  );
}

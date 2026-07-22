"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useWallet } from "../../lib/wallet";
import { deployed } from "../../lib/contracts";
import { addrUrl, short } from "../../lib/config";
import {
  IcoDashboard,
  IcoVault,
  IcoProve,
  IcoAudit,
  IcoContract,
  IcoGithub,
} from "./icons";

export type View = "dashboard" | "vaults" | "prove" | "audit";

const NAV: { id: View; label: string; Icon: (p: { size?: number }) => JSX.Element }[] = [
  { id: "dashboard", label: "Dashboard", Icon: IcoDashboard },
  { id: "vaults", label: "Vaults", Icon: IcoVault },
  { id: "prove", label: "Prove", Icon: IcoProve },
  { id: "audit", label: "Audit", Icon: IcoAudit },
];

const GITHUB = "https://github.com/coderansari/solvent";

function roleOf(address: string | null): string {
  if (!address) return "guest";
  const a = address.toLowerCase();
  if (deployed.operator && a === deployed.operator.toLowerCase()) return "operator";
  if (deployed.auditor && a === deployed.auditor.toLowerCase()) return "auditor";
  return "customer";
}

export default function Sidebar({
  view,
  onView,
  open,
}: {
  view: View;
  onView: (v: View) => void;
  open?: boolean;
}) {
  const { address, onSepolia, connect } = useWallet();

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <Image src="/logo.png" alt="Solvent" width={34} height={34} className="side-logo" unoptimized priority />
        Solvent
      </div>

      <div className="nav-label">Menu</div>
      <div className="nav-group">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${view === n.id ? "active" : ""}`}
            onClick={() => onView(n.id)}
          >
            <n.Icon size={19} />
            {n.label}
          </button>
        ))}
      </div>

      <div className="nav-label">Protocol</div>
      <div className="nav-group">
        <a
          className="nav-item"
          href={addrUrl(deployed.SolventVault)}
          target="_blank"
          rel="noreferrer"
        >
          <IcoContract size={19} />
          Contract
        </a>
        <a className="nav-item" href={GITHUB} target="_blank" rel="noreferrer">
          <IcoGithub size={19} />
          Source
        </a>
      </div>

      <div className="side-sep" />

      <div className="score-card">
        <div className="cap">Privacy posture</div>
        <div className="num">100</div>
        <div className="tag">Fully encrypted</div>
        <div className="score-bar">
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {address ? (
        <a
          className="wallet-chip"
          href={addrUrl(address)}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "none" }}
        >
          <span className="wallet-dot" />
          <span style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 13 }}>
              {short(address)}
            </div>
            <div style={{ fontSize: 11, color: "var(--faint)", textTransform: "capitalize" }}>
              {roleOf(address)} · {onSepolia ? "Sepolia" : "wrong net"}
            </div>
          </span>
        </a>
      ) : (
        <button className="wallet-chip" onClick={connect}>
          <span className="wallet-dot" />
          <span style={{ fontSize: 13 }}>Connect wallet</span>
        </button>
      )}
    </aside>
  );
}

"use client";

import Image from "next/image";
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
            aria-current={view === n.id ? "page" : undefined}
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

      {address ? (
        <a
          className="wallet-chip"
          href={addrUrl(address)}
          target="_blank"
          rel="noreferrer"
        >
          <span className="wallet-dot" />
          <span style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: "var(--fs-sm)" }}>
              {short(address)}
            </div>
            <div className="wallet-role">
              {roleOf(address)} · {onSepolia ? "Sepolia" : "Wrong network"}
            </div>
          </span>
        </a>
      ) : (
        <button className="wallet-chip" onClick={connect}>
          <span className="wallet-dot" />
          <span style={{ fontSize: "var(--fs-sm)" }}>Connect wallet</span>
        </button>
      )}
    </aside>
  );
}

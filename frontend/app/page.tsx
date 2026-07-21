"use client";

import { useState } from "react";
import { useWallet } from "../lib/wallet";
import { deployed } from "../lib/contracts";
import { short, addrUrl } from "../lib/config";
import { ToastProvider } from "../components/ui";
import Dashboard from "../components/Dashboard";
import Customer from "../components/Customer";
import Operator from "../components/Operator";
import Auditor from "../components/Auditor";

type Tab = "dashboard" | "customer" | "operator" | "auditor";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "customer", label: "Customer" },
  { id: "operator", label: "Operator" },
  { id: "auditor", label: "Auditor" },
];

function roleOf(address: string | null): string {
  if (!address) return "";
  const a = address.toLowerCase();
  if (deployed.operator && a === deployed.operator.toLowerCase()) return "operator";
  if (deployed.auditor && a === deployed.auditor.toLowerCase()) return "auditor";
  return "customer";
}

export default function Page() {
  const { address, onSepolia, connect, connecting, switchToSepolia } = useWallet();
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <ToastProvider>
      <div className="container">
        <div className="topbar">
          <div className="brand">
            <span className="lock">🔒</span> Solvent
          </div>
          <div className="topbar-right">
            <span className={`pill ${onSepolia ? "ok" : "bad"}`}>
              {onSepolia ? "Sepolia" : "Wrong network"}
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
        </div>

        <p className="hint" style={{ maxWidth: 640 }}>
          Prove <b>reserves ≥ liabilities</b> on-chain — <b>without revealing the numbers</b>.
          Computation runs in an iExec <b>Nox</b> TEE; only the boolean verdict is published.
        </p>

        {address && !onSepolia && (
          <div className="banner" style={{ marginTop: 16 }}>
            <span>Solvent runs on Ethereum Sepolia.</span>
            <button className="btn" onClick={switchToSepolia}>
              Switch to Sepolia
            </button>
          </div>
        )}

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab !== "dashboard" && !address ? (
          <div className="card hero">
            <div className="verdict pending">Connect your wallet</div>
            <div className="hero-sub">Connect MetaMask on Sepolia to use this view.</div>
          </div>
        ) : (
          <>
            {tab === "dashboard" && <Dashboard />}
            {tab === "customer" && <Customer />}
            {tab === "operator" && <Operator />}
            {tab === "auditor" && <Auditor />}
          </>
        )}

        <div className="footer">
          <span>Powered by iExec Nox · Confidential DeFi on ETH Sepolia</span>
          <span>
            {deployed.SolventVault ? (
              <a className="link" href={addrUrl(deployed.SolventVault)} target="_blank" rel="noreferrer">
                Contract ↗
              </a>
            ) : (
              "not deployed"
            )}
          </span>
        </div>
      </div>
    </ToastProvider>
  );
}

"use client";

import { deployed, isDeployed } from "../lib/contracts";
import { addrUrl } from "../lib/config";
import { useSolvency } from "../lib/useSolvency";
import { HandleChip, MotionCard } from "./ui";

function timeAgo(ts: number) {
  if (!ts) return "";
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Dashboard() {
  const { atts, latest, customers, loading } = useSolvency();

  return (
    <div className="grid">
      <MotionCard className="hero" glow>
        {!isDeployed() ? (
          <>
            <div className="verdict pending">Awaiting deployment</div>
            <div className="hero-sub">Contracts not yet configured for this build.</div>
          </>
        ) : loading ? (
          <div className="verdict pending shimmer">Loading…</div>
        ) : !latest ? (
          <>
            <div className="verdict pending">No proof yet</div>
            <div className="hero-sub">No solvency attestation has been published.</div>
          </>
        ) : (
          <>
            <div
              className={`verdict ${
                !latest.published ? "pending" : latest.solvent ? "ok" : "bad"
              }`}
            >
              <span className="seal">
                {!latest.published ? "⏳" : latest.solvent ? "✓" : "✕"}
              </span>
              {!latest.published ? "PENDING" : latest.solvent ? "SOLVENT" : "INSOLVENT"}
            </div>
            <div className="hero-sub">
              Attestation #{latest.id} · block {latest.blockNumber} · {timeAgo(latest.timestamp)}
            </div>
            <div className="hero-sub" style={{ marginTop: 6, maxWidth: 560, marginInline: "auto" }}>
              Reserves and liabilities are compared inside the Nox TEE — the numbers are never
              revealed on-chain.
            </div>
          </>
        )}
      </MotionCard>

      <div className="grid grid-3">
        <MotionCard className="stat" delay={0.05}>
          <span className="label">Total reserves</span>
          <span className="value hidden-val">🔒 hidden</span>
        </MotionCard>
        <MotionCard className="stat" delay={0.1}>
          <span className="label">Total liabilities</span>
          <span className="value hidden-val">🔒 hidden</span>
        </MotionCard>
        <MotionCard className="stat" delay={0.15}>
          <span className="label">Customers</span>
          <span className="value tnum">{customers || "—"}</span>
        </MotionCard>
      </div>

      <MotionCard delay={0.1}>
        <h2 className="section">Attestation history</h2>
        <div className="spacer" />
        {atts.length === 0 ? (
          <div className="hint">Nothing to show yet.</div>
        ) : (
          <div className="grid">
            {atts.map((a) => (
              <div key={a.id} className="row" style={{ justifyContent: "space-between" }}>
                <div className="row">
                  <span className={`pill ${!a.published ? "warn" : a.solvent ? "ok" : "bad"}`}>
                    {!a.published ? "⏳ pending" : a.solvent ? "✓ solvent" : "✕ insolvent"}
                  </span>
                  <span className="hint">
                    #{a.id} · block {a.blockNumber}
                  </span>
                </div>
                <div className="row">
                  {a.liabilitiesRoot && a.liabilitiesRoot !== "0x" + "0".repeat(64) && (
                    <span className="hint" title={`Liabilities Merkle root: ${a.liabilitiesRoot}`}>
                      🌳 root
                    </span>
                  )}
                  <HandleChip value={a.verdict} />
                </div>
              </div>
            ))}
          </div>
        )}
        {isDeployed() && (
          <>
            <div className="spacer" />
            <a className="link" href={addrUrl(deployed.SolventVault)} target="_blank" rel="noreferrer">
              View SolventVault on Etherscan ↗
            </a>
          </>
        )}
      </MotionCard>
    </div>
  );
}

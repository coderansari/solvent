"use client";

import { useCallback, useEffect, useState } from "react";
import { JsonRpcProvider } from "ethers";
import { deployed, isDeployed } from "../lib/contracts";
import { vaultContract } from "../lib/vault";
import { EXPLORER, SEPOLIA_PARAMS, addrUrl } from "../lib/config";
import { HandleChip } from "./ui";

type Att = {
  id: number;
  verdict: string;
  liabilitiesRoot: string;
  blockNumber: number;
  timestamp: number;
  published: boolean;
  solvent: boolean;
};

const readProvider = () => new JsonRpcProvider(SEPOLIA_PARAMS.rpcUrls[0]);

function timeAgo(ts: number) {
  if (!ts) return "";
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Dashboard() {
  const [atts, setAtts] = useState<Att[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<number>(0);

  const load = useCallback(async () => {
    if (!isDeployed()) {
      setLoading(false);
      return;
    }
    try {
      const v = vaultContract(readProvider());
      const count = Number(await v.attestationsCount());
      const out: Att[] = [];
      for (let i = count - 1; i >= 0 && i > count - 11; i--) {
        const a = await v.attestations(i);
        out.push({
          id: i,
          verdict: a[0],
          liabilitiesRoot: a[1],
          blockNumber: Number(a[2]),
          timestamp: Number(a[3]),
          published: a[4],
          solvent: a[5],
        });
      }
      setAtts(out);
      // customer count from Deposited events (best-effort)
      try {
        const from = deployed.deployBlock ?? 0;
        const logs = await v.queryFilter(v.filters.Deposited(), from, "latest");
        setCustomers(new Set(logs.map((l: any) => l.args?.customer)).size);
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, [load]);

  const latest = atts[0];

  return (
    <div className="grid">
      <div className="card hero">
        {!isDeployed() ? (
          <>
            <div className="verdict pending">⏳ Awaiting deployment</div>
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
              {!latest.published ? "⏳ PENDING" : latest.solvent ? "✅ SOLVENT" : "❌ INSOLVENT"}
            </div>
            <div className="hero-sub">
              Attestation #{latest.id} · block {latest.blockNumber} · {timeAgo(latest.timestamp)}
            </div>
            <div className="hero-sub" style={{ marginTop: 6 }}>
              Reserves and liabilities are compared inside the Nox TEE — the numbers are never
              revealed on-chain.
            </div>
          </>
        )}
      </div>

      <div className="grid grid-3">
        <div className="card stat">
          <span className="label">Total reserves</span>
          <span className="value hidden-val">🔒 hidden</span>
        </div>
        <div className="card stat">
          <span className="label">Total liabilities</span>
          <span className="value hidden-val">🔒 hidden</span>
        </div>
        <div className="card stat">
          <span className="label">Customers</span>
          <span className="value tnum">{customers || "—"}</span>
        </div>
      </div>

      <div className="card">
        <h2 className="section">Attestation history</h2>
        <div className="spacer" />
        {atts.length === 0 ? (
          <div className="hint">Nothing to show yet.</div>
        ) : (
          <div className="grid">
            {atts.map((a) => (
              <div key={a.id} className="row" style={{ justifyContent: "space-between" }}>
                <div className="row">
                  <span
                    className={`pill ${
                      !a.published ? "warn" : a.solvent ? "ok" : "bad"
                    }`}
                  >
                    {!a.published ? "⏳ pending" : a.solvent ? "✅ solvent" : "❌ insolvent"}
                  </span>
                  <span className="hint">#{a.id} · block {a.blockNumber}</span>
                </div>
                <div className="row">
                  {a.liabilitiesRoot &&
                    a.liabilitiesRoot !== "0x" + "0".repeat(64) && (
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
      </div>
    </div>
  );
}

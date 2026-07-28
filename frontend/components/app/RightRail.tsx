"use client";

import type { useSolvency } from "../../lib/useSolvency";
import type { View } from "./Sidebar";
import { deployed } from "../../lib/contracts";
import { addrUrl } from "../../lib/config";
import { Donut } from "./widgets";
import { IcoDeposit, IcoProve, IcoAudit, IcoContract, IcoArrow, IcoDoc } from "./icons";

type Sol = ReturnType<typeof useSolvency>;
const GITHUB = "https://github.com/coderansari/solvent";

export default function RightRail({ sol, onView }: { sol: Sol; onView: (v: View) => void }) {
  const published = sol.atts.filter((a) => a.published).length;
  const pending = Math.max(0, sol.atts.length - published);
  const total = sol.atts.length;

  return (
    <div className="right-rail">
      {/* proofs — every figure here comes from on-chain attestation state */}
      <div className="card">
        <div className="panel-head">
          <span className="panel-title">Proofs</span>
          <span className="pill ok" style={{ fontSize: "var(--fs-meta)" }}>
            <span className="live" /> Sepolia
          </span>
        </div>
        <div className="spacer" />
        <div className="donut-wrap">
          <Donut
            size={112}
            center={String(total)}
            sub="total"
            segments={
              total === 0
                ? [{ value: 1, color: "rgba(255,255,255,0.08)" }]
                : [
                    { value: published, color: "var(--emerald)" },
                    { value: pending, color: "var(--violet)" },
                  ]
            }
          />
          <div className="legend">
            <div className="lrow">
              <span className="ldot" style={{ background: "var(--emerald)" }} />
              Published
              <span className="lval">{published}</span>
            </div>
            <div className="lrow">
              <span className="ldot" style={{ background: "var(--violet)" }} />
              Pending
              <span className="lval">{pending}</span>
            </div>
            <div className="lrow">
              <span className="ldot" style={{ background: "var(--magenta)" }} />
              Customers
              <span className="lval">{sol.customers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* quick actions */}
      <div className="card">
        <div className="panel-head">
          <span className="panel-title">Quick actions</span>
        </div>
        <div className="spacer" />
        <div className="qa-grid">
          <button className="qa" onClick={() => onView("vaults")}>
            <span className="qico">
              <IcoDeposit size={20} />
            </span>
            Deposit
          </button>
          <button className="qa" onClick={() => onView("prove")}>
            <span className="qico">
              <IcoProve size={20} />
            </span>
            Prove solvency
          </button>
          <button className="qa" onClick={() => onView("audit")}>
            <span className="qico">
              <IcoAudit size={20} />
            </span>
            Audit totals
          </button>
          <a className="qa" href={addrUrl(deployed.SolventVault)} target="_blank" rel="noreferrer">
            <span className="qico">
              <IcoContract size={20} />
            </span>
            Contract
          </a>
        </div>
      </div>

      {/* integrate */}
      <div className="card" style={{ background: "linear-gradient(160deg, rgba(139,92,246,0.16), rgba(217,70,239,0.06))" }}>
        <span className="panel-title">Integrate Solvent</span>
        <div className="spacer" />
        <p className="hint">Confidential proof-of-solvency for your protocol, on iExec Nox.</p>
        <div className="spacer" />
        <a className="btn primary" href={`${GITHUB}/tree/main/docs`} target="_blank" rel="noreferrer">
          <IcoDoc size={16} /> Read the docs <IcoArrow size={16} />
        </a>
      </div>
    </div>
  );
}

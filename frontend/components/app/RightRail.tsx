"use client";

import { motion } from "framer-motion";
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

  const dots = [
    { top: "34%", left: "26%" },
    { top: "52%", left: "58%" },
    { top: "44%", left: "78%" },
    { top: "62%", left: "40%" },
  ];

  return (
    <div className="right-rail">
      {/* network status */}
      <div className="card">
        <div className="panel-head">
          <span className="panel-title">Network status</span>
          <span className="pill ok" style={{ fontSize: 12 }}>
            <span className="live" /> Live
          </span>
        </div>
        <div className="spacer" />
        <div className="status-map">
          {dots.map((d, i) => (
            <motion.span
              key={i}
              style={{
                position: "absolute",
                ...d,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i % 2 ? "var(--magenta)" : "var(--violet-2)",
                boxShadow: "0 0 10px currentColor",
                color: i % 2 ? "var(--magenta)" : "var(--violet-2)",
              }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 2.4, delay: i * 0.4 }}
            />
          ))}
        </div>
        <div className="spacer" />
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="hint">Ethereum Sepolia</span>
          <span className="hint">All systems operational</span>
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
          <span className="hint">Latest proof</span>
          <span className="hint">{sol.latest ? `#${sol.latest.id}` : "—"}</span>
        </div>
      </div>

      {/* proofs donut */}
      <div className="card">
        <div className="panel-head">
          <span className="panel-title">Proofs</span>
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
        <a className="btn primary" href={GITHUB} target="_blank" rel="noreferrer">
          <IcoDoc size={16} /> View docs <IcoArrow size={16} />
        </a>
      </div>
    </div>
  );
}

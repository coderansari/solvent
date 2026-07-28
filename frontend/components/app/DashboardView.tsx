"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { useSolvency } from "../../lib/useSolvency";
import {
  IcoVault,
  IcoProve,
  IcoUsers,
  IcoLock,
  IcoDeposit,
} from "./icons";
import { StatCard } from "./widgets";

type Sol = ReturnType<typeof useSolvency>;

function timeAgo(ts: number) {
  if (!ts) return "";
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const ACT_ICON: Record<string, (p: { size?: number }) => JSX.Element> = {
  deposit: IcoDeposit,
  credit: IcoUsers,
  reserves: IcoLock,
  attested: IcoProve,
  published: IcoVault,
};

export default function DashboardView({ sol }: { sol: Sol }) {
  const { latest, customers, deposits, atts, activity, loading } = sol;
  const verdictClass = !latest ? "pending" : !latest.published ? "pending" : latest.solvent ? "ok" : "bad";
  const verdictText = !latest
    ? "No proof yet"
    : !latest.published
    ? "Pending"
    : latest.solvent
    ? "Solvent"
    : "Insolvent";

  return (
    <div className="main-inner">
      {/* welcome */}
      <div className="welcome">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            Confidential proof
            <br />
            of solvency
          </motion.h1>
          <motion.p
            className="lede"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06 }}
          >
            <span className="accent">Private by default.</span> Verifiable always. Reserves are
            proven greater than liabilities inside a Nox TEE — the amounts never leave encrypted.
          </motion.p>
        </div>
        <div className="welcome-art">
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <Image
              src="/logo.png"
              alt=""
              width={220}
              height={220}
              style={{ objectFit: "contain" }}
              unoptimized
              priority
            />
          </div>
        </div>
      </div>

      {/* the verdict — the one loud thing on this page */}
      <motion.div
        className="card glow-violet"
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.04 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-5)", flexWrap: "wrap" }}
      >
        <div className={`verdict ${verdictClass}`}>
          <span className="seal" aria-hidden="true">
            {!latest || !latest.published ? "○" : latest.solvent ? "✓" : "✕"}
          </span>
          {loading ? "…" : verdictText}
        </div>
        <div style={{ textAlign: "right", minWidth: 180 }}>
          <div className="hint">
            {latest
              ? `Attestation #${latest.id} · block ${latest.blockNumber} · ${timeAgo(latest.timestamp)}`
              : "Awaiting the first solvency attestation"}
          </div>
          <div className="hint" style={{ marginTop: "var(--s-1)" }}>
            Reserves ≥ liabilities · verified in TEE · only the boolean is public
          </div>
        </div>
      </motion.div>

      {/* KPIs — each value reads from chain state */}
      <div className="kpi-row">
        <StatCard
          Icon={IcoProve}
          label="Proofs generated"
          value={loading ? "—" : String(atts.length ? sol.latest!.id + 1 : 0)}
          sub={latest ? `latest #${latest.id}` : "none yet"}
          delay={0.04}
        />
        <StatCard
          Icon={IcoUsers}
          label="Customers"
          value={loading ? "—" : String(customers)}
          sub="in liabilities root"
          delay={0.08}
        />
        <StatCard
          Icon={IcoLock}
          label="Confidential deposits"
          value={loading ? "—" : String(deposits)}
          sub="amounts encrypted"
          delay={0.12}
        />
      </div>

      {/* activity */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        <div className="panel-head">
          <span className="panel-title">Recent activity</span>
        </div>
        <div className="spacer" />
        {activity.length === 0 ? (
          <div className="hint">
            {loading ? "Loading on-chain events…" : "Deposit or attest to see events here."}
          </div>
        ) : (
          activity.map((a, i) => {
            const Ico = ACT_ICON[a.kind] ?? IcoVault;
            return (
              <div key={i} className="act">
                <span className="aico">
                  <Ico size={18} />
                </span>
                <div className="abody">
                  <div className="atitle">{a.title}</div>
                  <div className="asub">{a.sub}</div>
                </div>
                <span className="atime">block {a.block}</span>
                {a.tag && <span className={`tag-amt ${a.tagKind ?? "info"}`}>{a.tag}</span>}
              </div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}

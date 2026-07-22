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
    ? "PENDING"
    : latest.solvent
    ? "SOLVENT"
    : "INSOLVENT";

  return (
    <div className="main-inner">
      {/* welcome */}
      <div className="welcome">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            Confidential proof
            <br />
            of solvency
          </motion.h1>
          <motion.p
            className="lede"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <span className="accent">Private by default.</span> Verifiable always. Reserves are
            proven greater than liabilities inside a Nox TEE — the amounts never leave encrypted.
          </motion.p>
        </div>
        <div className="welcome-art">
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(217,70,239,0.28), transparent 70%)",
              filter: "blur(6px)",
            }}
          />
          <motion.div
            style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          >
            <Image
              src="/logo.png"
              alt="Solvent"
              width={220}
              height={220}
              style={{ objectFit: "contain", filter: "drop-shadow(0 10px 40px rgba(217,70,239,0.5))" }}
              priority
            />
          </motion.div>
        </div>
      </div>

      {/* verdict banner */}
      <motion.div
        className="card glow-violet"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}
      >
        <div className={`verdict ${verdictClass}`} style={{ fontSize: 40 }}>
          <span className="seal" style={{ width: 48, height: 48, fontSize: 24 }}>
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
          <div className="hint" style={{ marginTop: 4 }}>
            Reserves ≥ liabilities · verified in TEE · only the boolean is public
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="kpi-row">
        <StatCard
          Icon={IcoProve}
          label="Proofs generated"
          value={loading ? "—" : String(atts.length ? sol.latest!.id + 1 : 0)}
          sub={latest ? `latest #${latest.id}` : "none yet"}
          seed={11}
          color="var(--violet)"
          delay={0.05}
        />
        <StatCard
          Icon={IcoUsers}
          label="Customers"
          value={loading ? "—" : String(customers)}
          sub="in liabilities root"
          seed={23}
          color="var(--magenta)"
          delay={0.1}
        />
        <StatCard
          Icon={IcoLock}
          label="Confidential deposits"
          value={loading ? "—" : String(deposits)}
          sub="amounts encrypted"
          seed={37}
          color="var(--violet-2)"
          delay={0.15}
        />
        <StatCard
          Icon={IcoVault}
          label="Status"
          value={loading ? "—" : latest?.published ? (latest.solvent ? "Solvent" : "Insolvent") : "Pending"}
          sub="on Sepolia"
          up={!!latest?.solvent}
          seed={41}
          color="var(--emerald)"
          delay={0.2}
        />
      </div>

      {/* activity */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12 }}
      >
        <div className="panel-head">
          <span className="panel-title">Recent activity</span>
          <a className="link" href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13 }}>
            On-chain
          </a>
        </div>
        <div className="spacer" />
        {activity.length === 0 ? (
          <div className="hint">{loading ? "Loading on-chain events…" : "No activity yet."}</div>
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

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWallet } from "../lib/wallet";
import { useSolvency } from "../lib/useSolvency";
import { deployed, isDeployed } from "../lib/contracts";
import { addrUrl } from "../lib/config";
import { ToastProvider, Reveal } from "../components/ui";
import Nav from "../components/Nav";
import Hero from "../components/Hero";
import Dashboard from "../components/Dashboard";
import Customer from "../components/Customer";
import Operator from "../components/Operator";
import Auditor from "../components/Auditor";

type Tab = "dashboard" | "customer" | "operator" | "auditor";

const ease = [0.22, 1, 0.36, 1] as const;

// staggered scroll-reveal for the feature grid
const featWrap = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.08 } },
};
const featCard = {
  hidden: { opacity: 0, y: 44, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease, when: "beforeChildren", staggerChildren: 0.09 },
  },
};
const featItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "customer", label: "Customer" },
  { id: "operator", label: "Operator" },
  { id: "auditor", label: "Auditor" },
];

const FEATURES = [
  {
    title: "Encrypted end-to-end",
    body: "Balances and reserves are encrypted client-side. They never touch the chain in the clear — not in calldata, not in events.",
    icon: (
      <path
        d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Proven in a TEE",
    body: "The reserves ≥ liabilities comparison runs inside an iExec Nox trusted execution environment and returns one signed boolean.",
    icon: (
      <path
        d="M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Anyone can verify",
    body: "A Merkle root commits every customer balance, so each customer can prove their own inclusion — and auditors decrypt totals with a viewer key.",
    icon: (
      <path
        d="M4 12l5 5L20 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function Page() {
  const { address, onSepolia, switchToSepolia } = useWallet();
  const [tab, setTab] = useState<Tab>("dashboard");
  const { latest } = useSolvency();
  const heroSolvent = latest?.published ? latest.solvent : undefined;

  return (
    <ToastProvider>
      <Nav />
      <Hero solvent={heroSolvent} />

      {/* How it works */}
      <section className="container section-pad">
        <Reveal>
          <div className="sec-kicker">How it works</div>
          <h2 className="sec-title" style={{ maxWidth: 620 }}>
            Solvency you can verify. Numbers no one can see.
          </h2>
        </Reveal>
        <div className="spacer" />
        <motion.div
          className="grid grid-3"
          variants={featWrap}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-90px" }}
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              className="card"
              variants={featCard}
              whileHover={{ y: -6 }}
            >
              <motion.div className="feature-ico" variants={featItem}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  {f.icon}
                </svg>
              </motion.div>
              <motion.h2 className="section" variants={featItem}>
                {f.title}
              </motion.h2>
              <div className="spacer" />
              <motion.p className="hint" variants={featItem}>
                {f.body}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* App */}
      <section id="app" className="container" style={{ paddingTop: 40 }}>
        <Reveal>
          <div className="sec-head">
            <div>
              <div className="sec-kicker">Live on Sepolia</div>
              <h2 className="sec-title">The vault</h2>
            </div>
            {isDeployed() && (
              <a
                className="link"
                href={addrUrl(deployed.SolventVault)}
                target="_blank"
                rel="noreferrer"
              >
                Contract ↗
              </a>
            )}
          </div>
        </Reveal>

        {address && !onSepolia && (
          <div className="banner">
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
              {tab === t.id && (
                <motion.span
                  layoutId="tab-ind"
                  className="tab-ind"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
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
          </motion.div>
        </AnimatePresence>

        <div className="footer">
          <span>Powered by iExec Nox · Confidential DeFi on ETH Sepolia</span>
          <span>
            {isDeployed() ? (
              <a className="link" href={addrUrl(deployed.SolventVault)} target="_blank" rel="noreferrer">
                SolventVault ↗
              </a>
            ) : (
              "not deployed"
            )}
          </span>
        </div>
      </section>
    </ToastProvider>
  );
}

"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { deployed, isDeployed } from "../lib/contracts";
import { addrUrl, SPLINE_HERO_URL } from "../lib/config";
import SplineFrame from "./SplineFrame";

const VaultScene = dynamic(() => import("./three/VaultScene"), {
  ssr: false,
  loading: () => null,
});

const ease = [0.22, 1, 0.36, 1] as const;
const rise = {
  hidden: { y: 26, opacity: 0 },
  show: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, ease, delay: 0.15 + i * 0.09 },
  }),
};

export default function Hero({ solvent }: { solvent?: boolean }) {
  return (
    <section id="top" className="hero-wrap">
      <div className="hero-canvas">
        {SPLINE_HERO_URL ? (
          <SplineFrame url={SPLINE_HERO_URL} />
        ) : (
          <VaultScene solvent={solvent} />
        )}
      </div>

      <div className="hero-content">
        <motion.span className="eyebrow" variants={rise} initial="hidden" animate="show" custom={0}>
          <span className="dot" /> Confidential DeFi · iExec Nox · ETH Sepolia
        </motion.span>

        <motion.h1 className="hero-title" variants={rise} initial="hidden" animate="show" custom={1}>
          Prove you&apos;re
          <br />
          <span className="grad">solvent.</span> Reveal nothing.
        </motion.h1>

        <motion.p className="hero-lede" variants={rise} initial="hidden" animate="show" custom={2}>
          Solvent proves <b>reserves ≥ liabilities</b> on-chain while the amounts stay
          encrypted. The comparison runs inside an iExec <b>Nox TEE</b> — only a single
          boolean verdict is ever published.
        </motion.p>

        <motion.div className="hero-cta" variants={rise} initial="hidden" animate="show" custom={3}>
          <a href="#app" className="btn white">
            Launch app →
          </a>
          {isDeployed() && (
            <a
              href={addrUrl(deployed.SolventVault)}
              target="_blank"
              rel="noreferrer"
              className="btn ghost"
            >
              View contract ↗
            </a>
          )}
        </motion.div>
      </div>

      <motion.div
        className="scroll-cue"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
      >
        <span className="bar" />
        Scroll
      </motion.div>
    </section>
  );
}

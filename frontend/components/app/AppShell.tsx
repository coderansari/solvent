"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWallet } from "../../lib/wallet";
import { useSolvency } from "../../lib/useSolvency";
import { ToastProvider } from "../ui";
import Sidebar, { type View } from "./Sidebar";
import Topbar from "./Topbar";
import RightRail from "./RightRail";
import DashboardView from "./DashboardView";
import Customer from "../Customer";
import Operator from "../Operator";
import Auditor from "../Auditor";

const TITLES: Record<Exclude<View, "dashboard">, { title: string; sub: string }> = {
  vaults: { title: "Vaults", sub: "Deposit, view your encrypted balance, and prove inclusion." },
  prove: { title: "Prove solvency", sub: "Set reserves, attest in the TEE, and publish the verdict." },
  audit: { title: "Audit", sub: "Decrypt the confidential totals with your viewer key." },
};

export default function AppShell() {
  const [view, setView] = useState<View>("dashboard");
  const [menu, setMenu] = useState(false);
  const { address } = useWallet();
  const sol = useSolvency();

  const go = (v: View) => {
    setView(v);
    setMenu(false);
  };

  return (
    <ToastProvider>
      <div className="shell">
        <Sidebar view={view} onView={go} open={menu} />
        {menu && <div className="side-overlay" onClick={() => setMenu(false)} />}

        <div className="main-col">
          <Topbar onMenu={() => setMenu((m) => !m)} />

          <div className="main-grid">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ minWidth: 0 }}
              >
                {view === "dashboard" ? (
                  <DashboardView sol={sol} />
                ) : (
                  <div className="main-inner">
                    <div>
                      <h1
                        className="display"
                        style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}
                      >
                        {TITLES[view].title}
                      </h1>
                      <p className="hint" style={{ marginTop: 6 }}>
                        {TITLES[view].sub}
                      </p>
                    </div>

                    {!address ? (
                      <div className="card hero">
                        <div className="verdict pending" style={{ fontSize: 30 }}>
                          Connect your wallet
                        </div>
                        <div className="hero-sub">Connect MetaMask on Sepolia to use this view.</div>
                      </div>
                    ) : (
                      <>
                        {view === "vaults" && <Customer />}
                        {view === "prove" && <Operator />}
                        {view === "audit" && <Auditor />}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <RightRail sol={sol} onView={go} />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

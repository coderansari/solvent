"use client";

import { useCallback, useEffect, useState } from "react";
import { JsonRpcProvider } from "ethers";
import { deployed, isDeployed } from "./contracts";
import { vaultContract } from "./vault";
import { SEPOLIA_PARAMS } from "./config";

export type Att = {
  id: number;
  verdict: string;
  liabilitiesRoot: string;
  blockNumber: number;
  timestamp: number;
  published: boolean;
  solvent: boolean;
};

const readProvider = () => new JsonRpcProvider(SEPOLIA_PARAMS.rpcUrls[0]);

export type Activity = {
  kind: "deposit" | "credit" | "reserves" | "attested" | "published";
  title: string;
  sub: string;
  block: number;
  tag?: string;
  tagKind?: "pos" | "info";
};

/** Polls the vault for the recent attestation feed + customer count + activity. */
export function useSolvency(pollMs = 12000) {
  const [atts, setAtts] = useState<Att[]>([]);
  const [customers, setCustomers] = useState(0);
  const [deposits, setDeposits] = useState(0);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

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

      // event-sourced activity feed (best-effort)
      try {
        const from = deployed.deployBlock ?? 0;
        const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
        const [dep, cred, res, att, pub] = await Promise.all([
          v.queryFilter(v.filters.Deposited(), from, "latest"),
          v.queryFilter(v.filters.CustomerCredited(), from, "latest"),
          v.queryFilter(v.filters.ReservesUpdated(), from, "latest"),
          v.queryFilter(v.filters.SolvencyAttested(), from, "latest"),
          v.queryFilter(v.filters.SolvencyPublished(), from, "latest"),
        ]);

        setDeposits(dep.length);
        setCustomers(new Set(dep.map((l: any) => l.args?.customer)).size);

        const items: Activity[] = [];
        for (const l of dep as any[])
          items.push({
            kind: "deposit",
            title: "Confidential deposit",
            sub: short(l.args?.customer),
            block: l.blockNumber,
            tag: "encrypted",
            tagKind: "info",
          });
        for (const l of cred as any[])
          items.push({
            kind: "credit",
            title: "Customer credited",
            sub: short(l.args?.customer),
            block: l.blockNumber,
            tag: "private",
            tagKind: "info",
          });
        for (const l of res as any[])
          items.push({
            kind: "reserves",
            title: "Reserves updated",
            sub: "encrypted total",
            block: l.blockNumber,
          });
        for (const l of att as any[])
          items.push({
            kind: "attested",
            title: "Solvency attested",
            sub: `proof #${Number(l.args?.id)}`,
            block: l.blockNumber,
          });
        for (const l of pub as any[])
          items.push({
            kind: "published",
            title: l.args?.solvent ? "Verdict published · solvent" : "Verdict published",
            sub: `proof #${Number(l.args?.id)}`,
            block: l.blockNumber,
            tag: l.args?.solvent ? "verified" : "insolvent",
            tagKind: "pos",
          });

        items.sort((a, b) => b.block - a.block);
        setActivity(items.slice(0, 6));
      } catch {
        /* best-effort */
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, pollMs);
    return () => clearInterval(t);
  }, [load, pollMs]);

  const latest = atts[0];
  return { atts, latest, customers, deposits, activity, loading, reload: load };
}

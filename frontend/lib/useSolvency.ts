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

/** Polls the vault for the recent attestation feed + customer count. */
export function useSolvency(pollMs = 12000) {
  const [atts, setAtts] = useState<Att[]>([]);
  const [customers, setCustomers] = useState(0);
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
      try {
        const from = deployed.deployBlock ?? 0;
        const logs = await v.queryFilter(v.filters.Deposited(), from, "latest");
        setCustomers(new Set(logs.map((l: any) => l.args?.customer)).size);
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
  return { atts, latest, customers, loading, reload: load };
}

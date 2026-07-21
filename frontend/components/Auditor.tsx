"use client";

import { useState } from "react";
import { formatUnits } from "ethers";
import { useWallet } from "../lib/wallet";
import { getHandleClient } from "../lib/nox";
import { vaultContract } from "../lib/vault";
import { deployed } from "../lib/contracts";
import { short } from "../lib/config";
import { TxButton, useToast } from "./ui";

const ZERO = "0x" + "0".repeat(64);

export default function Auditor() {
  const { signer, address } = useWallet();
  const { push } = useToast();
  const [vals, setVals] = useState<{ r?: string; l?: string }>({});

  const isAuditor =
    address && deployed.auditor && address.toLowerCase() === deployed.auditor.toLowerCase();

  const decrypt = async () => {
    if (!signer) return;
    const vault = vaultContract(signer);
    const client = await getHandleClient(signer);
    const rH: string = await vault.confidentialReserves();
    const lH: string = await vault.confidentialTotalLiabilities();
    push("Decrypting with viewer key…");
    const out: { r?: string; l?: string } = {};
    if (rH && rH !== ZERO) out.r = formatUnits(BigInt((await client.decrypt(rH as any)).value as any), 6);
    if (lH && lH !== ZERO) out.l = formatUnits(BigInt((await client.decrypt(lH as any)).value as any), 6);
    setVals(out);
    push("Decrypted ✓", "ok");
  };

  return (
    <div className="grid">
      <div className="card">
        <h2 className="section">Auditor view</h2>
        <p className="hint">
          The nominated auditor ({short(deployed.auditor)}) holds a Nox viewer key granting
          read access to the confidential totals — selective disclosure for compliance, without
          exposing them to anyone else.
        </p>
        {!isAuditor && (
          <>
            <div className="spacer" />
            <div className="banner">
              <span>Connected wallet is not the auditor — decryption will be denied by the ACL.</span>
            </div>
          </>
        )}
        <div className="spacer" />
        <div className="grid grid-2">
          <div className="stat">
            <span className="label">Verified reserves</span>
            <span className="value hidden-val">
              {vals.r !== undefined ? `${vals.r} tUSDC` : "🔒 encrypted"}
            </span>
          </div>
          <div className="stat">
            <span className="label">Verified total liabilities</span>
            <span className="value hidden-val">
              {vals.l !== undefined ? `${vals.l} tUSDC` : "🔒 encrypted"}
            </span>
          </div>
        </div>
        <div className="spacer" />
        <TxButton primary onRun={() => decrypt().catch((e) => push(e.message ?? "Failed", "err"))}>
          Decrypt totals (viewer key)
        </TxButton>
      </div>
    </div>
  );
}

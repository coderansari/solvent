"use client";

import { useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import { useWallet } from "../lib/wallet";
import { getHandleClient } from "../lib/nox";
import { vaultContract } from "../lib/vault";
import { deployed } from "../lib/contracts";
import { short } from "../lib/config";
import { TxButton, useToast } from "./ui";

const ZERO = "0x" + "0".repeat(64);
const APP = deployed.SolventVault as `0x${string}`;

export default function Operator() {
  const { signer, address } = useWallet();
  const { push } = useToast();
  const [reserves, setReserves] = useState("1000000");
  const [creditAddr, setCreditAddr] = useState("");
  const [creditAmt, setCreditAmt] = useState("500");
  const [revealed, setRevealed] = useState<{ r?: string; l?: string }>({});

  const isOperator =
    address && deployed.operator && address.toLowerCase() === deployed.operator.toLowerCase();

  const setReservesTx = async () => {
    if (!signer) return;
    const client = await getHandleClient(signer);
    push("Encrypting reserves…");
    const { handle, handleProof } = await client.encryptInput(
      parseUnits(reserves || "0", 6),
      "uint256",
      APP
    );
    const vault = vaultContract(signer);
    const tx = await vault.setReserves(handle, handleProof);
    push("Submitting encrypted reserves…");
    await tx.wait();
    push("Reserves set (encrypted) ✓", "ok");
  };

  const credit = async () => {
    if (!signer || !creditAddr) return;
    const client = await getHandleClient(signer);
    push("Encrypting credit…");
    const { handle, handleProof } = await client.encryptInput(
      parseUnits(creditAmt || "0", 6),
      "uint256",
      APP
    );
    const vault = vaultContract(signer);
    const tx = await vault.operatorCredit(creditAddr, handle, handleProof);
    push("Crediting customer confidentially…");
    await tx.wait();
    push("Customer credited ✓", "ok");
  };

  const attest = async () => {
    if (!signer) return;
    const vault = vaultContract(signer);
    const tx = await vault.attest();
    push("Computing reserves ≥ liabilities in the TEE…");
    await tx.wait();
    push("Attested ✓ — now publish the verdict", "ok");
  };

  const publish = async () => {
    if (!signer) return;
    const vault = vaultContract(signer);
    const count = Number(await vault.attestationsCount());
    if (count === 0) {
      push("Attest first.", "err");
      return;
    }
    const id = count - 1;
    const a = await vault.attestations(id);
    if (a[3]) {
      push(`Attestation #${id} already published.`, "err");
      return;
    }
    const handle: string = a[0];
    push("Fetching TEE decryption proof…");
    const client = await getHandleClient(signer);
    const { decryptionProof } = await client.publicDecrypt(handle as any);
    const tx = await vault.publishVerdict(id, decryptionProof);
    push("Publishing verdict on-chain…");
    await tx.wait();
    push("Verdict published ✓", "ok");
  };

  const decryptTotals = async () => {
    if (!signer) return;
    const vault = vaultContract(signer);
    const client = await getHandleClient(signer);
    const rH: string = await vault.confidentialReserves();
    const lH: string = await vault.confidentialTotalLiabilities();
    push("Decrypting totals (operator key)…");
    const out: { r?: string; l?: string } = {};
    if (rH && rH !== ZERO) out.r = formatUnits(BigInt((await client.decrypt(rH as any)).value as any), 6);
    if (lH && lH !== ZERO) out.l = formatUnits(BigInt((await client.decrypt(lH as any)).value as any), 6);
    setRevealed(out);
    push("Decrypted ✓", "ok");
  };

  return (
    <div className="grid">
      {!isOperator && (
        <div className="banner">
          <span>
            Connected wallet is not the operator ({short(deployed.operator)}). Operator-only
            actions will revert. In the demo the operator can be a Safe multisig.
          </span>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h2 className="section">Reserves</h2>
          <p className="hint">Declare your total reserves — encrypted before it ever hits chain.</p>
          <div className="spacer" />
          <div className="field">
            <label>Reserves (tUSDC)</label>
            <input
              className="input tnum"
              value={reserves}
              onChange={(e) => setReserves(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <TxButton full primary onRun={() => setReservesTx().catch((e) => push(e.message ?? "Failed", "err"))}>
            Set encrypted reserves
          </TxButton>
        </div>

        <div className="card">
          <h2 className="section">Credit a customer (confidential)</h2>
          <p className="hint">Adjust a balance privately (e.g. PnL) so it diverges from deposits.</p>
          <div className="spacer" />
          <div className="field">
            <label>Customer address</label>
            <input
              className="input mono"
              placeholder="0x…"
              value={creditAddr}
              onChange={(e) => setCreditAddr(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Amount (tUSDC)</label>
            <input
              className="input tnum"
              value={creditAmt}
              onChange={(e) => setCreditAmt(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <TxButton full onRun={() => credit().catch((e) => push(e.message ?? "Failed", "err"))}>
            Credit confidentially
          </TxButton>
        </div>
      </div>

      <div className="card">
        <h2 className="section">Prove solvency</h2>
        <p className="hint">
          Attest computes <span className="mono">reserves ≥ liabilities</span> in the TEE; publish
          reveals only the boolean via a gateway-signed proof.
        </p>
        <div className="spacer" />
        <div className="row">
          <TxButton primary onRun={() => attest().catch((e) => push(e.message ?? "Failed", "err"))}>
            1 · Attest solvency
          </TxButton>
          <TxButton onRun={() => publish().catch((e) => push(e.message ?? "Failed", "err"))}>
            2 · Publish verdict
          </TxButton>
        </div>
      </div>

      <div className="card">
        <h2 className="section">Your private view</h2>
        <p className="hint">As operator you hold ACL access to the real totals.</p>
        <div className="spacer" />
        <div className="grid grid-2">
          <div className="stat">
            <span className="label">Reserves</span>
            <span className="value hidden-val">
              {revealed.r !== undefined ? `${revealed.r} tUSDC` : "🔒 encrypted"}
            </span>
          </div>
          <div className="stat">
            <span className="label">Total liabilities</span>
            <span className="value hidden-val">
              {revealed.l !== undefined ? `${revealed.l} tUSDC` : "🔒 encrypted"}
            </span>
          </div>
        </div>
        <div className="spacer" />
        <TxButton onRun={() => decryptTotals().catch((e) => push(e.message ?? "Failed", "err"))}>
          Decrypt totals
        </TxButton>
      </div>
    </div>
  );
}

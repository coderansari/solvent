"use client";

import { useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import { useWallet } from "../lib/wallet";
import { getHandleClient } from "../lib/nox";
import { usdcContract, vaultContract } from "../lib/vault";
import { deployed } from "../lib/contracts";
import { txUrl } from "../lib/config";
import { TxButton, useToast } from "./ui";

export default function Customer() {
  const { signer, address } = useWallet();
  const { push } = useToast();
  const [amount, setAmount] = useState("100");
  const [myBalance, setMyBalance] = useState<string | null>(null);

  const faucet = async () => {
    if (!signer) return;
    const usdc = usdcContract(signer);
    const tx = await usdc.faucet(parseUnits(amount || "0", 6));
    push("Minting test USDC…");
    const r = await tx.wait();
    push(`Minted ${amount} tUSDC ✓`, "ok");
    console.log(txUrl(r.hash));
  };

  const deposit = async () => {
    if (!signer) return;
    const amt = parseUnits(amount || "0", 6);
    const usdc = usdcContract(signer);
    const vault = vaultContract(signer);
    const approveTx = await usdc.approve(deployed.SolventVault, amt);
    push("Approving…");
    await approveTx.wait();
    const tx = await vault.deposit(amt);
    push("Depositing (building confidential claim)…");
    await tx.wait();
    push("Deposited ✓ — your claim is now encrypted", "ok");
  };

  const decryptMine = async () => {
    if (!signer || !address) return;
    const vault = vaultContract(signer);
    const handle: string = await vault.confidentialClaimOf(address);
    if (!handle || handle === "0x" + "0".repeat(64)) {
      push("No claim yet — deposit first.", "err");
      return;
    }
    push("Requesting decryption (sign to authorize)…");
    const client = await getHandleClient(signer);
    const { value } = await client.decrypt(handle as any);
    setMyBalance(formatUnits(BigInt(value as any), 6));
    push("Decrypted your balance ✓", "ok");
  };

  return (
    <div className="grid grid-2">
      <div className="card">
        <h2 className="section">Your confidential balance</h2>
        <p className="hint">Only you and the auditor can decrypt this value.</p>
        <div className="spacer" />
        <div className="stat">
          <span className="label">Balance</span>
          <span className="value hidden-val">
            {myBalance !== null ? `${myBalance} tUSDC` : "🔒 encrypted"}
          </span>
        </div>
        <div className="spacer" />
        <TxButton full onRun={() => decryptMine().catch((e) => push(e.message ?? "Failed", "err"))}>
          Decrypt my balance
        </TxButton>
      </div>

      <div className="card">
        <h2 className="section">Deposit</h2>
        <p className="hint">Get test USDC, then deposit to receive an encrypted claim.</p>
        <div className="spacer" />
        <div className="field">
          <label>Amount (tUSDC)</label>
          <input
            className="input tnum"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="row">
          <TxButton onRun={() => faucet().catch((e) => push(e.message ?? "Failed", "err"))}>
            Get test USDC
          </TxButton>
          <TxButton primary onRun={() => deposit().catch((e) => push(e.message ?? "Failed", "err"))}>
            Approve &amp; Deposit
          </TxButton>
        </div>
      </div>
    </div>
  );
}

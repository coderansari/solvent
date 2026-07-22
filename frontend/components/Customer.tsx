"use client";

import { useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import { useWallet } from "../lib/wallet";
import { getHandleClient } from "../lib/nox";
import { usdcContract, vaultContract, cusdcContract } from "../lib/vault";
import { buildLiabilitiesTree, proofForCustomer } from "../lib/merkle";
import { deployed, hasConfidentialAsset } from "../lib/contracts";
import { txUrl } from "../lib/config";
import { TxButton, useToast } from "./ui";

export default function Customer() {
  const { signer, address } = useWallet();
  const { push } = useToast();
  const [amount, setAmount] = useState("100");
  const [confAmount, setConfAmount] = useState("25");
  const [myBalance, setMyBalance] = useState<string | null>(null);
  const [inclusion, setInclusion] = useState<string | null>(null);

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

  const confidentialDeposit = async () => {
    if (!signer || !address) return;
    const amt = parseUnits(confAmount || "0", 6);
    const cusdc = cusdcContract(signer);
    const vault = vaultContract(signer);
    push("Minting confidential USDC…");
    await (await cusdc.faucet(amt)).wait();
    push("Authorizing the vault to pull the encrypted amount…");
    await (await cusdc.setOperator(deployed.SolventVault, 4102444800)).wait();
    const client = await getHandleClient(signer);
    push("Encrypting deposit amount…");
    const { handle, handleProof } = await client.encryptInput(
      amt,
      "uint256",
      deployed.SolventVault as `0x${string}`
    );
    push("Depositing confidentially (amount hidden end-to-end)…");
    await (await vault.depositConfidential(handle, handleProof)).wait();
    push("Confidential deposit ✓ — the amount never appears on-chain", "ok");
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

  const verifyInclusion = async () => {
    if (!signer || !address) return;
    const vault = vaultContract(signer);
    const count = Number(await vault.attestationsCount());
    if (count === 0) {
      push("No attestation published yet.", "err");
      return;
    }
    const id = count - 1;
    push("Rebuilding the Merkle tree from public state…");
    const { tree, entries } = await buildLiabilitiesTree(vault);
    const p = proofForCustomer(tree, entries, address);
    if (!p) {
      setInclusion(`❌ Not in attestation #${id} — deposit before the next attestation.`);
      push("You are not in the latest attested set.", "err");
      return;
    }
    const ok: boolean = await vault.verifyInclusion(id, address, p.handle, p.proof);
    setInclusion(
      ok
        ? `✅ Your balance is included in attestation #${id}`
        : `❌ Inclusion check failed for #${id}`
    );
    push(ok ? "Inclusion verified on-chain ✓" : "Inclusion returned false", ok ? "ok" : "err");
  };

  return (
    <div className="grid">
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
          <div className="spacer" />
          <TxButton
            full
            onRun={() => verifyInclusion().catch((e) => push(e.message ?? "Failed", "err"))}
          >
            Verify my inclusion
          </TxButton>
          {inclusion && (
            <>
              <div className="spacer" />
              <p className="hint" style={{ fontWeight: 600 }}>
                {inclusion}
              </p>
            </>
          )}
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

      {hasConfidentialAsset() && (
        <div className="card">
          <h2 className="section">Confidential deposit (amount hidden)</h2>
          <p className="hint">
            Deposit via a confidential ERC-7984 token — the amount is encrypted end-to-end and
            never appears in calldata or events, not even at the token layer. Only the faucet
            mint is public.
          </p>
          <div className="spacer" />
          <div className="field">
            <label>Amount (cUSDC)</label>
            <input
              className="input tnum"
              value={confAmount}
              onChange={(e) => setConfAmount(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <TxButton
            full
            primary
            onRun={() => confidentialDeposit().catch((e) => push(e.message ?? "Failed", "err"))}
          >
            Faucet &amp; confidential deposit
          </TxButton>
        </div>
      )}
    </div>
  );
}

import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { createEthersHandleClient } from "@iexec-nox/handle";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

// End-to-end integration proof on a LIVE Nox network (Sepolia). Exercises the full
// confidential flow that cannot run on a local Hardhat node:
//   faucet -> public deposit -> operatorCredit -> setReserves -> build Merkle root ->
//   attest(root) -> publicDecrypt -> publishVerdict (assert solvent) ->
//   confidential ERC-7984 deposit -> verifyInclusion.
//
// Run: npm run smoke:sepolia  (requires SEPOLIA_RPC_URL + PRIVATE_KEY in contracts/.env)

const ZERO32 = "0x" + "0".repeat(64);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(label: string, fn: () => Promise<T>, tries = 8, delayMs = 8000): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      console.log(`  …${label} not ready (attempt ${i + 1}/${tries}); retrying in ${delayMs / 1000}s`);
      await sleep(delayMs);
    }
  }
  throw last;
}

async function main() {
  if (network.name !== "sepolia") throw new Error("Run with --network sepolia");

  const dep = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "..", "frontend", "deployments", "sepolia.json"), "utf8")
  );
  const [signer] = await ethers.getSigners();
  console.log(`Operator/customer: ${signer.address}`);
  const fromBlock: number = dep.deployBlock ?? 0;

  const usdc = await ethers.getContractAt("TestUSDC", dep.TestUSDC, signer);
  const cusdc = await ethers.getContractAt("ConfidentialUSDC", dep.ConfidentialUSDC, signer);
  const vault = await ethers.getContractAt("SolventVault", dep.SolventVault, signer);
  const nox = await createEthersHandleClient(signer as any);

  const DEPOSIT = 100n * 10n ** 6n; // 100 tUSDC
  const CREDIT = 50n * 10n ** 6n; // +50 confidential credit
  const RESERVES = 1_000_000n * 10n ** 6n; // 1,000,000 reserves
  const CONF_DEPOSIT = 25n * 10n ** 6n; // 25 cUSDC confidential deposit

  // 1) Public deposit --------------------------------------------------------
  console.log("\n[1] Public deposit");
  await (await usdc.faucet(DEPOSIT)).wait();
  await (await usdc.approve(dep.SolventVault, DEPOSIT)).wait();
  await (await vault.deposit(DEPOSIT)).wait();
  console.log("  deposited 100 tUSDC");

  // 2) Operator credit (encrypted delta) ------------------------------------
  console.log("\n[2] Operator credit (+50, encrypted)");
  {
    const { handle, handleProof } = await nox.encryptInput(CREDIT, "uint256", dep.SolventVault);
    await (await vault.operatorCredit(signer.address, handle, handleProof)).wait();
    console.log("  credited +50 (balance now diverges from deposit)");
  }

  // 3) Confidential ERC-7984 deposit (amount hidden) — before attest so the -----
  //    committed Merkle root reflects the customer's final balance.
  console.log("\n[3] Confidential deposit (amount hidden)");
  await (await cusdc.faucet(CONF_DEPOSIT)).wait();
  {
    // authorize the vault to pull the encrypted amount, then submit it encrypted
    const farFuture = 4102444800; // year 2100
    await (await cusdc.setOperator(dep.SolventVault, farFuture)).wait();
    const { handle, handleProof } = await nox.encryptInput(CONF_DEPOSIT, "uint256", dep.SolventVault);
    await (await vault.depositConfidential(handle, handleProof)).wait();
    console.log("  depositConfidential -> vault credited (no amount in calldata)");
  }

  // 4) Set encrypted reserves ------------------------------------------------
  console.log("\n[4] setReserves (encrypted)");
  {
    const { handle, handleProof } = await nox.encryptInput(RESERVES, "uint256", dep.SolventVault);
    await (await vault.setReserves(handle, handleProof)).wait();
    console.log("  reserves set (encrypted)");
  }

  // 5) Build the liabilities Merkle root -------------------------------------
  console.log("\n[5] Build Merkle root over customer set");
  const root1 = await buildRoot(vault, fromBlock);
  console.log(`  root: ${root1}`);

  // 6) Attest ----------------------------------------------------------------
  console.log("\n[6] attest(root)");
  const attestTx = await (await vault.attest(root1)).wait();
  const id = (await vault.attestationsCount()) - 1n;
  console.log(`  attestation id ${id} at block ${attestTx?.blockNumber}`);

  // 7) Public decrypt + publish ----------------------------------------------
  console.log("\n[7] publicDecrypt verdict + publishVerdict");
  const att = await vault.attestations(id);
  const verdictHandle = att[0];
  const { value, decryptionProof } = await withRetry("verdict proof", () =>
    nox.publicDecrypt(verdictHandle as any)
  );
  console.log(`  gateway says solvent = ${value}`);
  await (await vault.publishVerdict(id, decryptionProof)).wait();
  const published = await vault.attestations(id);
  if (!published[4]) throw new Error("verdict not published");
  if (!published[5]) throw new Error("EXPECTED solvent=true");
  console.log(`  ✅ published on-chain: solvent = ${published[5]}`);

  // 8) Verify inclusion ------------------------------------------------------
  console.log("\n[8] verifyInclusion for the customer");
  const { tree, entries } = await buildTree(vault, fromBlock);
  const idx = entries.findIndex((e) => e[0].toLowerCase() === signer.address.toLowerCase());
  const proof = tree.getProof(idx);
  const [, handle] = entries[idx];
  const ok = await vault.verifyInclusion(id, signer.address, handle, proof);
  console.log(`  included in attestation #${id}: ${ok}`);
  if (!ok) throw new Error("inclusion proof failed");

  console.log("\nSMOKE PASSED ✅  full confidential flow verified on Sepolia.");
}

// Rebuild the exact StandardMerkleTree the contract expects, from public state:
// customer set (Deposited/CustomerCredited events) + on-chain claim handles.
async function buildTree(vault: any, fromBlock: number): Promise<{ tree: StandardMerkleTree<[string, string]>; entries: [string, string][] }> {
  const deposited = await vault.queryFilter(vault.filters.Deposited(), fromBlock, "latest");
  const credited = await vault.queryFilter(vault.filters.CustomerCredited(), fromBlock, "latest");
  const customers = Array.from(
    new Set([...deposited, ...credited].map((e: any) => e.args.customer as string))
  );
  const entries: [string, string][] = [];
  for (const c of customers) {
    const h = await vault.confidentialClaimOf(c);
    if (h !== ZERO32) entries.push([c, h]);
  }
  const tree = StandardMerkleTree.of(entries, ["address", "bytes32"]);
  return { tree, entries };
}

async function buildRoot(vault: any, fromBlock: number): Promise<string> {
  const { tree } = await buildTree(vault, fromBlock);
  return tree.root;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

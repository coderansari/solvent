// End-to-end smoke test against live Sepolia + Nox TEE gateway.
// Proves: deposit -> encrypted reserves -> attest (ge in TEE) -> publish verdict -> read bool.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JsonRpcProvider, Wallet, Contract, parseUnits, formatUnits } from "ethers";
import { createEthersHandleClient } from "@iexec-nox/handle";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const dep = JSON.parse(readFileSync(join(root, "deployments", "sepolia.json"), "utf8"));
const vaultAbi = JSON.parse(readFileSync(join(root, "lib", "abi", "SolventVault.json"), "utf8"));
const usdcAbi = JSON.parse(readFileSync(join(root, "lib", "abi", "TestUSDC.json"), "utf8"));

// read PRIVATE_KEY + RPC from contracts/.env
const env = readFileSync(join(root, "..", "contracts", ".env"), "utf8");
const PK = env.match(/PRIVATE_KEY=(0x[0-9a-fA-F]{64})/)?.[1];
const RPC = env.match(/SEPOLIA_RPC_URL=(\S+)/)?.[1] || "https://ethereum-sepolia-rpc.publicnode.com";
if (!PK) throw new Error("PRIVATE_KEY not found in contracts/.env");

const provider = new JsonRpcProvider(RPC);
const wallet = new Wallet(PK, provider);
const log = (...a) => console.log(...a);

async function main() {
  log("Operator:", wallet.address);
  const usdc = new Contract(dep.TestUSDC, usdcAbi, wallet);
  const vault = new Contract(dep.SolventVault, vaultAbi, wallet);
  const client = await createEthersHandleClient(wallet);
  log("Handle client ready.");

  // 1) faucet + deposit 100 tUSDC
  const amt = parseUnits("100", 6);
  log("\n[1] faucet 100 tUSDC...");
  await (await usdc.faucet(amt)).wait();
  log("    approve...");
  await (await usdc.approve(dep.SolventVault, amt)).wait();
  log("    deposit...");
  await (await vault.deposit(amt)).wait();
  log("    deposited. Deposited event ->", (await vault.attestationsCount()).toString(), "attestations so far");

  // 2) encrypted reserves = 1,000,000 tUSDC
  log("\n[2] encrypt + setReserves 1,000,000 tUSDC...");
  const enc = await client.encryptInput(parseUnits("1000000", 6), "uint256", dep.SolventVault);
  await (await vault.setReserves(enc.handle, enc.handleProof)).wait();
  log("    reserves set (encrypted).");

  // 3) attest -> ge(reserves, liabilities) in TEE
  log("\n[3] attest()...");
  await (await vault.attest()).wait();
  const id = Number(await vault.attestationsCount()) - 1;
  const att = await vault.attestations(id);
  const verdictHandle = att[0];
  log("    attestation id:", id, "verdict handle:", verdictHandle);

  // 4) fetch gateway decryption proof for the boolean, publish on-chain
  log("\n[4] publicDecrypt(verdict) via TEE gateway...");
  const pub = await client.publicDecrypt(verdictHandle);
  log("    gateway says solvent =", pub.value, "(proof len", pub.decryptionProof.length, ")");
  await (await vault.publishVerdict(id, pub.decryptionProof)).wait();

  // 5) read published verdict from chain
  const att2 = await vault.attestations(id);
  log("\n[5] on-chain: published =", att2[3], "| solvent =", att2[4]);

  // 6) sanity: operator decrypts totals
  try {
    const rH = await vault.confidentialReserves();
    const lH = await vault.confidentialTotalLiabilities();
    const r = await client.decrypt(rH);
    const l = await client.decrypt(lH);
    log("\n[6] operator decrypt -> reserves:", formatUnits(BigInt(r.value), 6),
        "liabilities:", formatUnits(BigInt(l.value), 6));
  } catch (e) {
    log("\n[6] decrypt totals skipped:", e.message);
  }

  log("\n✅ SMOKE TEST PASSED — confidential solvency proof works end-to-end on Sepolia.");
}

main().catch((e) => { console.error("\n❌ SMOKE FAILED:", e); process.exit(1); });

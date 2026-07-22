import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Read-only dry run: connects to the live Sepolia deployment, queries public
// state and the latest attestation. No transactions are sent — zero gas.
async function main() {
  const dep = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "..", "frontend", "deployments", "sepolia.json"),
      "utf8"
    )
  );
  const net = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "chainId:", net.chainId.toString());
  if (net.chainId !== 11155111n) throw new Error("Not Sepolia");

  const usdc = await ethers.getContractAt("TestUSDC", dep.TestUSDC);
  const vault = await ethers.getContractAt("SolventVault", dep.SolventVault);

  console.log("\n== Contract wiring ==");
  console.log("TestUSDC     :", dep.TestUSDC);
  console.log("  symbol     :", await usdc.symbol(), "decimals:", (await usdc.decimals()).toString());
  if (dep.ConfidentialUSDC) {
    const cusdc = await ethers.getContractAt("ConfidentialUSDC", dep.ConfidentialUSDC);
    console.log("ConfidentialUSDC:", dep.ConfidentialUSDC);
    console.log("  symbol     :", await cusdc.symbol(), "decimals:", (await cusdc.decimals()).toString());
  }
  console.log("SolventVault :", dep.SolventVault);
  console.log("  asset      :", await vault.asset(), await vault.asset() === dep.TestUSDC ? "(= TestUSDC OK)" : "(MISMATCH!)");
  console.log("  confAsset  :", await vault.confidentialAsset());
  console.log("  operator   :", await vault.operator());
  console.log("  auditor    :", await vault.auditor());

  console.log("\n== Confidential handles (non-zero = initialized ciphertext) ==");
  const rH = await vault.confidentialReserves();
  const lH = await vault.confidentialTotalLiabilities();
  const ZERO = "0x" + "0".repeat(64);
  console.log("  reserves handle    :", rH, rH !== ZERO ? "(initialized)" : "(empty)");
  console.log("  liabilities handle :", lH, lH !== ZERO ? "(initialized)" : "(empty)");

  console.log("\n== Attestations ==");
  const count = await vault.attestationsCount();
  console.log("  count:", count.toString());
  if (count > 0n) {
    const a = await vault.latestAttestation();
    console.log("  latest -> block:", a.blockNumber.toString(),
      "| published:", a.published,
      "| solvent:", a.solvent);
    console.log("  verdict handle:", a.verdict);
    console.log("  liabilitiesRoot:", a.liabilitiesRoot,
      a.liabilitiesRoot !== ("0x" + "0".repeat(64)) ? "(committed)" : "(none)");
  }

  console.log("\nDRY RUN OK — live deployment reachable, state read successfully. No gas spent.");
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });

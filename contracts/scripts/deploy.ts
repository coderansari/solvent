import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const auditor = process.env.AUDITOR_ADDRESS || deployer.address;

  console.log(`Deploying with ${deployer.address} on ${network.name}`);
  console.log(`Auditor: ${auditor}`);

  const USDC = await ethers.getContractFactory("TestUSDC");
  const usdc = await USDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();
  console.log(`TestUSDC deployed:      ${usdcAddr}`);

  const Vault = await ethers.getContractFactory("SolventVault");
  const vault = await Vault.deploy(usdcAddr, deployer.address, auditor);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(`SolventVault deployed:  ${vaultAddr}`);

  const deployment = {
    chainId: 11155111,
    network: network.name,
    TestUSDC: usdcAddr,
    SolventVault: vaultAddr,
    operator: deployer.address,
    auditor,
    noxCompute: "0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF",
    deployedAt: new Date().toISOString(),
  };

  const dir = path.join(__dirname, "..", "..", "frontend", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "sepolia.json"),
    JSON.stringify(deployment, null, 2)
  );
  console.log("Wrote frontend/deployments/sepolia.json");
  console.log("\nVerify with:");
  console.log(`  npx hardhat verify --network sepolia ${usdcAddr}`);
  console.log(
    `  npx hardhat verify --network sepolia ${vaultAddr} ${usdcAddr} ${deployer.address} ${auditor}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

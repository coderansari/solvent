import { ethers, network } from "hardhat";
async function main() {
  const [s] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(s.address);
  const net = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "chainId:", net.chainId.toString());
  console.log("Deployer:", s.address);
  console.log("Balance :", ethers.formatEther(bal), "ETH");
  if (bal === 0n) { console.log("!! ZERO BALANCE — fund before deploy"); process.exit(1); }
}
main().catch((e)=>{console.error(e.message||e);process.exit(1);});

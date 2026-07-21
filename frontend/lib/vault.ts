import { Contract, ContractRunner } from "ethers";
import { solventAbi, usdcAbi, deployed } from "./contracts";

export function vaultContract(runner: ContractRunner) {
  return new Contract(deployed.SolventVault, solventAbi as any, runner);
}

export function usdcContract(runner: ContractRunner) {
  return new Contract(deployed.TestUSDC, usdcAbi as any, runner);
}

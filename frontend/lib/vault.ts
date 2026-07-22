import { Contract, ContractRunner } from "ethers";
import { solventAbi, usdcAbi, cusdcAbi, deployed } from "./contracts";

export function vaultContract(runner: ContractRunner) {
  return new Contract(deployed.SolventVault, solventAbi as any, runner);
}

export function usdcContract(runner: ContractRunner) {
  return new Contract(deployed.TestUSDC, usdcAbi as any, runner);
}

export function cusdcContract(runner: ContractRunner) {
  return new Contract(deployed.ConfidentialUSDC as string, cusdcAbi as any, runner);
}

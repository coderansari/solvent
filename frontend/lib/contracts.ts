import solventAbi from "./abi/SolventVault.json";
import usdcAbi from "./abi/TestUSDC.json";
import cusdcAbi from "./abi/ConfidentialUSDC.json";
import deployment from "../deployments/sepolia.json";

export { solventAbi, usdcAbi, cusdcAbi };
export const deployed = deployment as {
  chainId: number;
  network: string;
  TestUSDC: string;
  ConfidentialUSDC?: string;
  SolventVault: string;
  operator: string;
  auditor: string;
  noxCompute: string;
  deployBlock?: number;
  deployedAt: string;
};

export const isDeployed = () =>
  Boolean(deployed.SolventVault && deployed.TestUSDC);

export const hasConfidentialAsset = () => Boolean(deployed.ConfidentialUSDC);

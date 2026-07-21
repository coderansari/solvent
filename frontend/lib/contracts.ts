import solventAbi from "./abi/SolventVault.json";
import usdcAbi from "./abi/TestUSDC.json";
import deployment from "../deployments/sepolia.json";

export { solventAbi, usdcAbi };
export const deployed = deployment as {
  chainId: number;
  network: string;
  TestUSDC: string;
  SolventVault: string;
  operator: string;
  auditor: string;
  noxCompute: string;
  deployedAt: string;
};

export const isDeployed = () =>
  Boolean(deployed.SolventVault && deployed.TestUSDC);

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_HEX = "0xaa36a7";
export const EXPLORER = "https://sepolia.etherscan.io";
export const NOX_COMPUTE = "0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF";
export const USDC_DECIMALS = 6;

export const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_CHAIN_HEX,
  chainName: "Ethereum Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
  blockExplorerUrls: [EXPLORER],
};

export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const addrUrl = (addr: string) => `${EXPLORER}/address/${addr}`;
export const short = (a?: string) =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";

/** Published Spline scene for the hero (empty string → procedural 3D fallback). */
export const SPLINE_HERO_URL =
  "https://my.spline.design/defiassetspadlock-GR88BK76f93CYJh0XDdtYCY7/";

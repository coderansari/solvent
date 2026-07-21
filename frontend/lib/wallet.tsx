"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_HEX, SEPOLIA_PARAMS } from "./config";
import { resetHandleClient } from "./nox";

type WalletState = {
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connecting: boolean;
  onSepolia: boolean;
  connect: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
};

const Ctx = createContext<WalletState | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eth = () => (typeof window !== "undefined" ? (window as any).ethereum : undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [connecting, setConnecting] = useState(false);

  const refresh = useCallback(async () => {
    const e = eth();
    if (!e) return;
    const p = new BrowserProvider(e);
    const accounts: string[] = await e.request({ method: "eth_accounts" });
    const net = await p.getNetwork();
    setProvider(p);
    setChainId(Number(net.chainId));
    if (accounts.length) {
      const s = await p.getSigner();
      setSigner(s);
      setAddress(await s.getAddress());
    } else {
      setSigner(null);
      setAddress(null);
    }
  }, []);

  const connect = useCallback(async () => {
    const e = eth();
    if (!e) {
      alert("MetaMask not found. Please install it to use Solvent.");
      return;
    }
    setConnecting(true);
    try {
      await e.request({ method: "eth_requestAccounts" });
      resetHandleClient();
      await refresh();
    } finally {
      setConnecting(false);
    }
  }, [refresh]);

  const switchToSepolia = useCallback(async () => {
    const e = eth();
    if (!e) return;
    try {
      await e.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_HEX }],
      });
    } catch (err: any) {
      if (err?.code === 4902) {
        await e.request({
          method: "wallet_addEthereumChain",
          params: [SEPOLIA_PARAMS],
        });
      }
    }
    await refresh();
  }, [refresh]);

  useEffect(() => {
    const e = eth();
    if (!e) return;
    refresh();
    const onAccounts = () => {
      resetHandleClient();
      refresh();
    };
    const onChain = () => refresh();
    e.on?.("accountsChanged", onAccounts);
    e.on?.("chainChanged", onChain);
    return () => {
      e.removeListener?.("accountsChanged", onAccounts);
      e.removeListener?.("chainChanged", onChain);
    };
  }, [refresh]);

  const value = useMemo<WalletState>(
    () => ({
      address,
      chainId,
      provider,
      signer,
      connecting,
      onSepolia: chainId === SEPOLIA_CHAIN_ID,
      connect,
      switchToSepolia,
    }),
    [address, chainId, provider, signer, connecting, connect, switchToSepolia]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet must be used within WalletProvider");
  return v;
}

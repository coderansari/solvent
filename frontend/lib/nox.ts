"use client";

import { createEthersHandleClient } from "@iexec-nox/handle";
import type { JsonRpcSigner } from "ethers";

// A cached handle client per signer address so we don't re-init on every call.
let cached: { address: string; client: Awaited<ReturnType<typeof createEthersHandleClient>> } | null =
  null;

export async function getHandleClient(signer: JsonRpcSigner) {
  const address = await signer.getAddress();
  if (cached && cached.address === address) return cached.client;
  const client = await createEthersHandleClient(signer);
  cached = { address, client };
  return client;
}

export function resetHandleClient() {
  cached = null;
}

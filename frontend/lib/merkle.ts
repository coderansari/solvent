import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { Contract } from "ethers";
import { deployed } from "./contracts";

const ZERO32 = "0x" + "0".repeat(64);
const LEAF_ENCODING = ["address", "bytes32"];

export type Entry = [string, string]; // [customer, balanceHandle]

/**
 * Rebuild the exact liabilities Merkle tree the contract commits to, purely from
 * public on-chain state: the customer set (Deposited / CustomerCredited events) and
 * each customer's encrypted-claim handle (confidentialClaimOf). No amounts involved,
 * so any client can reproduce the identical root the operator committed at attest time.
 */
export async function buildLiabilitiesTree(
  vault: Contract
): Promise<{ tree: StandardMerkleTree<Entry>; entries: Entry[] }> {
  const from = deployed.deployBlock ?? 0;
  const deposited = await vault.queryFilter(vault.filters.Deposited(), from, "latest");
  const credited = await vault.queryFilter(vault.filters.CustomerCredited(), from, "latest");
  const customers = Array.from(
    new Set(
      [...deposited, ...credited].map((e: any) => (e.args.customer as string).toLowerCase())
    )
  );

  const entries: Entry[] = [];
  for (const c of customers) {
    const handle: string = await vault.confidentialClaimOf(c);
    if (handle && handle !== ZERO32) entries.push([c, handle]);
  }

  const tree = StandardMerkleTree.of(entries, LEAF_ENCODING);
  return { tree, entries };
}

/** Merkle proof for one customer against the freshly-rebuilt tree, or null if absent. */
export function proofForCustomer(
  tree: StandardMerkleTree<Entry>,
  entries: Entry[],
  customer: string
): { handle: string; proof: string[] } | null {
  const idx = entries.findIndex((e) => e[0].toLowerCase() === customer.toLowerCase());
  if (idx < 0) return null;
  return { handle: entries[idx][1], proof: tree.getProof(idx) };
}

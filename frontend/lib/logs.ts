import { JsonRpcProvider, type EventLog, type Log } from "ethers";
import { vaultContract } from "./vault";
import { READ_RPCS } from "./config";

const CHUNK = 5000; // keep under public-RPC getLogs range caps

/**
 * Fetch the given vault events from `fromBlock` to head, resilient to public
 * RPCs that reject wide/historical eth_getLogs. Tries each READ_RPC in turn
 * and queries in bounded block chunks. Returns logs keyed by event name.
 */
export async function queryVaultEvents(
  eventNames: string[],
  fromBlock: number
): Promise<Record<string, (EventLog | Log)[]>> {
  let lastErr: unknown;
  for (const url of READ_RPCS) {
    try {
      const p = new JsonRpcProvider(url, undefined, { staticNetwork: true });
      const v = vaultContract(p);
      const latest = await p.getBlockNumber();
      const out: Record<string, (EventLog | Log)[]> = {};
      for (const name of eventNames) out[name] = [];
      for (let start = fromBlock; start <= latest; start += CHUNK + 1) {
        const end = Math.min(start + CHUNK, latest);
        for (const name of eventNames) {
          const logs = await v.queryFilter(v.filters[name](), start, end);
          out[name].push(...logs);
        }
      }
      return out;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Could not read event logs from any RPC");
}

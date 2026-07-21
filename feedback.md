# Feedback on the iExec Nox tooling

Written after building **Solvent** end-to-end (confidential proof-of-solvency) on Nox for the WTF Hackathon. Overall the developer experience is genuinely good — the `Nox` Solidity library feels like writing normal Solidity, and the fact that ETH Sepolia is preconfigured in the SDK meant the encrypt → compute → decrypt loop worked without any infra of our own. Below is honest, specific feedback, roughly ordered by impact.

## What worked really well 👍

- **`Nox.sol` is a clean, well-documented API.** Typed handles (`euint256`, `ebool`, `externalEuint256`), `fromExternal`, `add/ge/select`, and the `allow*` family map almost 1:1 to the mental model. NatSpec is thorough, including the warning about re-granting ACL.
- **ERC-7984 + `ERC20ToERC7984Wrapper` are excellent primitives.** Being able to wrap a public ERC-20 into a confidential token is exactly the "add privacy without modifying the protocol" story the hackathon asks for.
- **SDK network config is batteries-included.** `NETWORK_CONFIGS` already contains the Sepolia gateway, NoxCompute address, and subgraph — `createEthersHandleClient(signer)` just works on chain 11155111.
- **Gasless, ACL-gated decryption** via EIP-712 is a great UX — no key export, and `publicDecrypt` returning `{ value, decryptionProof }` makes the "reveal only the verdict" pattern trivial to implement on-chain (`Nox.publicDecrypt(handle, proof)`).
- The **`finalizeUnwrap` reference** in the wrapper was the single most useful code example — it showed the exact `allowPublicDecryption` → gateway proof → on-chain verify round-trip.

## Friction / bugs we hit 🐞

1. **`nox-hardhat-starter` is a dead link (404).** It's referenced from the docs and the linktree, but `github.com/iExec-Nox/nox-hardhat-starter` returns *Repository not found*. We scaffolded plain Hardhat instead. Either restore the repo or remove the link.
2. **`nox-hardhat-plugin` is a placeholder.** Its README is the Hardhat-3 plugin template (`"should print Hola, Hardhat!"`, `<!-- TODO update readme -->`). Not usable yet — worth marking as WIP so people don't sink time into it.
3. **`Solidity 0.8.35 is not fully supported yet` (Hardhat warning).** `Nox.sol` is `pragma ^0.8.35`, but Hardhat prints this warning and notes stack traces may not work. Pinning a version Hardhat fully supports (or documenting the exact `solc` + `evmVersion: "cancun"` combo) would save confusion. It compiles fine, but the warning is unsettling for newcomers.
4. **The JS SDK barrel import forces `viem` even for ethers users.** Importing `@iexec-nox/handle` pulls in `ViemBlockchainService`, so a pure-ethers Next.js build fails with `Module not found: Can't resolve 'viem'` until you add `viem` as a dependency. Consider making viem/ethers truly optional via subpath exports (e.g. `@iexec-nox/handle/ethers`).
5. **Docs are mid-migration and sparse in places.** `docs.iex.ec/nox-protocol/...` 308-redirects to `docs.noxprotocol.io`, and several reference pages (JS SDK getting-started, individual method pages) are stubs ("content under development"). The concrete `encryptInput`/`decrypt` signatures live only in the package `README`/types, not the docs site.
6. **`encryptInput`'s `applicationContract` is typed as `` `0x${string}` ``.** Passing a plain `string` address (e.g. from a deployments JSON) is a TS error; a small `Address` helper or accepting `string` would smooth this.
7. **The ACL "#1 bug" is real and easy to hit.** Forgetting to re-`allowThis`/`allow` after a handle mutation silently breaks the *next* transaction. The docs warn about it, but a lint rule, a helper like `persist(handle, owners[])`, or an event on access-loss would help a lot.

## Nice-to-haves 💡

- A canonical, working **Hardhat starter** (deploy script + one confidential contract + a decrypt script) — the missing 404 repo.
- **Deployed testnet addresses** (NoxCompute, gateway) collected on one docs page. We found them by reading `Nox.sol` and the SDK's `networks.ts`.
- Gateway **sync-latency guidance**: after a compute tx, `publicDecrypt` can 404 briefly until the TEE syncs. The SDK retries, but documenting expected timing would help UX (we show a "computing in the TEE…" state).
- A `euint64` option — `euint256` is generous, but 64-bit would cut gas for token-sized amounts (the OZ wrapper uses `euint64`).

## Summary

We built a real, end-to-end confidential dApp on Sepolia in a single sprint, writing zero cryptography ourselves — that's a strong signal for the platform. The main rough edges are **docs/tooling completeness** (dead starter repo, stub pages) rather than the protocol itself. Fixing the 404 starter and the viem import would remove most of the early-stage friction.

# 🔒 Solvent — Confidential Proof of Solvency

**Prove `reserves ≥ liabilities` on-chain — without revealing the numbers.**

Solvent is a confidential **Proof-of-Reserves-&-Liabilities** dApp built on [iExec **Nox**](https://docs.noxprotocol.io), the confidential smart-contract layer that runs computations on encrypted data inside Intel-TDX TEEs. An exchange, fund, or DAO treasury can prove it is solvent to the whole world while keeping every balance, total, and reserve figure private.

> After FTX, everyone demands proof of reserves — but honest, fully-transparent proof leaks customer balances, position sizes, and strategy. Solvent computes `reserves ≥ liabilities` **inside a TEE** and publishes **only the boolean verdict** on-chain. Customers decrypt only their own balance; an auditor gets a viewer key; the public sees just `✅ Solvent`.

Built for the **iExec WTF Hackathon (Summer Edition)**. Deployed on **Ethereum Sepolia**. No mock data — real ERC-20, real TEE.

---

## How it works

```
Customer ─deposit(real tUSDC)→ SolventVault ─encrypted ledger (euint256)→ NoxCompute (TEE)
Operator ─setReserves(enc) / operatorCredit(enc) / attest()→ ge(reserves, liabilities) → ebool verdict
Public   ─publishVerdict(gateway proof)→ on-chain ✅ / ❌ only
Customer / Auditor ─Nox SDK decrypt→ own balance / totals (ACL-gated)
```

1. **Deposit** — customers deposit real test-USDC; the vault keeps an **encrypted** per-customer claim and an encrypted running total of liabilities. A **confidential deposit** path (ERC-7984) also lets the *amount itself* stay encrypted end-to-end — hidden even at the token layer.
2. **Reserves** — the operator declares **encrypted** reserves (models cold + hot wallets).
3. **Attest** — `attest(root)` computes `reserves ≥ liabilities` in the TEE, producing an encrypted boolean and marking it publicly decryptable, and commits a **Merkle root** over every customer balance.
4. **Publish** — anyone submits the gateway-signed decryption proof; the contract verifies it and stores **only the boolean** verdict.
5. **Selective disclosure** — a customer decrypts *their own* claim and can **prove inclusion** in the attested liabilities via `verifyInclusion` (no amount revealed); the auditor decrypts the totals via a viewer key; everyone else sees `🔒`.

**No plaintext amount ever appears on-chain.** Events carry addresses and ids only.

## What makes it strong

- **Merkle proof-of-inclusion** — at attestation time the vault commits a Merkle root over `(customer, encrypted-balance-handle)` leaves. Any client rebuilds the identical tree from public on-chain state (events + `confidentialClaimOf`) and proves *their own* inclusion — turning "trust the boolean" into "verify you were counted", without leaking a single amount.
- **Confidential deposits (ERC-7984)** — a `ConfidentialUSDC` confidential token hides transfer amounts. `depositConfidential` imports an encrypted amount and pulls it via `confidentialTransferFrom`, so the deposit size never appears in calldata or events (only the public faucet mint is the on-ramp boundary).
- **Hardened + tested** — `ReentrancyGuard` on token-moving paths, custom errors, and a local Hardhat suite (18 tests: access control, guards, and Merkle valid/invalid proofs) plus a live Sepolia integration script covering the full encrypted flow.

## Why it's confidential (and composable)

- Encrypted values live off-chain in the TEE; the chain stores only 32-byte **handles** + an on-chain **ACL**.
- All encrypted math, comparisons, and access control come from the audited [`Nox`](https://www.npmjs.com/package/@iexec-nox/nox-protocol-contracts) Solidity library — Solvent adds **no cryptography of its own** and **modifies no underlying protocol**.
- The operator can be a **Safe** multisig — Solvent layers confidential solvency proofs on top of an unmodified treasury.

## Repository layout

```
solvent/
├── contracts/            # Hardhat project (Solidity 0.8.35, evmVersion cancun)
│   ├── contracts/SolventVault.sol
│   ├── contracts/TestUSDC.sol
│   ├── contracts/ConfidentialUSDC.sol      # ERC-7984 confidential token
│   ├── contracts/test/MerkleHarness.sol    # test-only
│   ├── scripts/deploy.ts  scripts/smoke.ts  scripts/dryrun.ts
│   └── test/              # local Hardhat suite (18 tests, no live Nox needed)
├── frontend/             # Next.js App Router + ethers v6 + @iexec-nox/handle
│   ├── app/  components/  lib/  (lib/merkle.ts — client-side tree rebuild)
│   └── deployments/sepolia.json   # written by deploy
├── docs/                 # ARCHITECTURE.md, THREAT_MODEL.md
├── feedback.md           # feedback on the iExec Nox tooling
└── DEMO_SCRIPT.md
```

## Prerequisites

- Node.js 20+
- A wallet with **Sepolia test ETH** ([faucet](https://sepoliafaucet.com))
- MetaMask in the browser

## 1 · Deploy the contracts

```bash
cd contracts
npm install
cp .env.example .env        # fill in SEPOLIA_RPC_URL + PRIVATE_KEY (testnet only)
npm run compile
npm test                    # 18 local unit tests (no live Nox needed)
npm run deploy:sepolia      # deploys TestUSDC + ConfidentialUSDC + SolventVault, writes frontend/deployments/sepolia.json
npm run smoke:sepolia       # full end-to-end proof on live Sepolia (see below)
```

Optionally verify on Etherscan:

```bash
npx hardhat verify --network sepolia <TestUSDC>
npx hardhat verify --network sepolia <ConfidentialUSDC>
npx hardhat verify --network sepolia <SolventVault> <TestUSDC> <operator> <auditor> <ConfidentialUSDC>
```

Environment variables (`contracts/.env`):

| Var | Purpose |
|-----|---------|
| `SEPOLIA_RPC_URL` | Sepolia JSON-RPC endpoint |
| `PRIVATE_KEY` | Deployer / operator key (**testnet only**) |
| `ETHERSCAN_API_KEY` | Optional, for `hardhat verify` |
| `AUDITOR_ADDRESS` | Optional auditor (defaults to deployer) |

## 2 · Run the frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

The frontend reads contract addresses from `frontend/deployments/sepolia.json` (written by the deploy step). Connect MetaMask on Sepolia.

## 3 · Try it end-to-end

1. **Customer** tab → *Get test USDC* → *Approve & Deposit*. (Optionally *Faucet & confidential deposit* — the amount is hidden even at the token layer.)
2. **Operator** tab → *Set encrypted reserves* → (optionally *Credit confidentially*) → *Attest solvency* (commits the Merkle root) → *Publish verdict*.
3. **Dashboard** → see `✅ SOLVENT` with all numbers `🔒 hidden` and the committed 🌳 root.
4. **Customer** → *Decrypt my balance* (only yours) and *Verify my inclusion* (proves you were counted, on-chain). **Auditor** → *Decrypt totals* (viewer key).
5. Open the contract on Etherscan — confirm **no amounts** are ever visible.

## Testing

```bash
cd contracts
npm test                 # local Hardhat suite: access control, guards, Merkle valid/invalid proofs
npm run coverage         # coverage for the non-encrypted paths
npm run smoke:sepolia    # live integration: deposit → credit → confidential deposit → setReserves
                         #  → attest(root) → publicDecrypt → publishVerdict (asserts solvent=true) → verifyInclusion
npm run dryrun:sepolia   # read-only health check of the live deployment
```

> **Why two tiers?** Nox encrypted operations run in an off-chain TEE reached via the live `NoxCompute` contract, so they can't execute on a bare local Hardhat node. The local suite covers everything non-encrypted (and the pure-keccak Merkle logic); the Sepolia script proves the encrypted flow against the real gateway.

## Tech

- **Contracts:** Solidity 0.8.35 · `@iexec-nox/nox-protocol-contracts` · `@iexec-nox/nox-confidential-contracts` (ERC-7984) · OpenZeppelin (MerkleProof, ReentrancyGuard) · Hardhat (evmVersion `cancun`)
- **Frontend:** Next.js 14 · TypeScript · ethers v6 · `@iexec-nox/handle` · `@openzeppelin/merkle-tree`
- **Network:** Ethereum Sepolia · NoxCompute `0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF`

## License

MIT © coderansari

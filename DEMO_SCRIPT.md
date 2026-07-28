# Demo script (≤ 4 minutes)

Goal: show a real, working confidential proof-of-solvency on Sepolia — amounts stay hidden, the verdict is public and verifiable. Keep it tight.

**Setup before recording**
- Contracts are deployed and Etherscan-verified. Vault `0xDb72f13b746c326F0f2291483A3979eFb6cA932b`, tUSDC `0x1FA49cc3E1e6ae3D8A717eD36C7426bC58883255`, cUSDC `0xe4393Cb1834F0812D2c514f8C1920b56fd1b90F9`.
- Frontend on https://solvent-psi.vercel.app (or local).
- MetaMask on Sepolia, unlocked, with the Operator account (= deployer = auditor) selected. A second Customer account is optional — the operator address can play customer too, which saves account-switching time on camera.
- Etherscan open on the vault address in a second tab.

**Sidebar labels are Dashboard / Vaults / Prove / Audit.** Vaults is the customer view, Prove is the operator view, Audit is the auditor view.

---

### 0:00 – 0:20 · The problem
> "After FTX, every exchange is asked to prove reserves exceed liabilities. But a real proof leaks every customer's balance and the firm's whole book — so they publish nothing, or a PDF you can't check. Solvent proves it on-chain without revealing a single amount, using iExec Nox confidential compute."

Open the **Dashboard**. Point at the verdict block and the three KPI tiles (proofs, customers, confidential deposits). Every figure here reads from chain state.

### 0:20 – 1:00 · Customer deposit, encrypted claim
- **Vaults** → *Get test USDC* → *Approve & Deposit* (100).
- "That's a real ERC-20 transfer. This path is deliberately public — you can see the 100 in calldata. What's now encrypted is my **claim**: what the operator owes me."
- *Decrypt my balance* → sign → your number appears.
- "Only I and the auditor can decrypt this. Not other customers, not the public."

### 1:00 – 1:30 · Confidential deposit — the amount never appears
- Still in **Vaults**, scroll to *Confidential deposit* → *Faucet & confidential deposit* (25 cUSDC).
- "This is the ERC-7984 path. The amount is encrypted client-side and pulled with `confidentialTransferFrom` — it never appears in calldata or events, not even at the token layer. Only the faucet mint is public, which is the fiat on-ramp analogue."

> This beat is what separates Solvent from a normal proof-of-reserves demo. Don't cut it.

### 1:30 – 2:25 · Operator runs the proof
- **Prove** (mention the operator can be a **Safe multisig** — the contract only checks an address).
- *Set encrypted reserves* (1,000,000) — "encrypted in the browser before it ever reaches the chain."
- **Reserves must be set before attesting** — `attest` reverts `ReservesNotSet` otherwise, so an empty vault can't publish a vacuous "Solvent".
- *(Optional, cut if tight)* *Credit confidentially* — "balances can diverge from public deposits, fully privately."
- **1 · Attest solvency** — "this computes `reserves ≥ liabilities` inside the TEE and commits a Merkle root over every customer balance."
- **2 · Publish verdict** — "the TEE returns a gateway-signed proof of just the boolean, and the contract verifies that signature on-chain."

### 2:25 – 2:50 · The reveal
- **Dashboard** → the verdict reads **Solvent**, with the attestation id and block.
- Switch to **Etherscan** → the vault's events. "The verdict is here. Reserves, liabilities, every balance — all encrypted handles. The only number this contract ever published is one boolean."

### 2:50 – 3:20 · Prove you were counted
- **Vaults** → *Verify my inclusion* → "included in attestation #N".
- "This isn't trust-the-boolean. I just proved my balance was inside the attested liabilities — via a Merkle proof the contract checked — without revealing the amount."

> **Do this immediately after publishing, before any further deposit or credit.** `verifyInclusion` checks your *current* claim handle against the committed root, and any new deposit mints a fresh handle that won't match.

### 3:20 – 3:45 · Selective disclosure
- **Audit** (auditor account) → *Decrypt totals* → real reserves and liabilities appear.
- "The auditor holds a Nox viewer key. Compliance-grade disclosure to exactly one party — and to nobody else."

### 3:45 – 4:00 · Close
> "Real token, real TEE, live on Sepolia. Solvent turns proof-of-reserves from a trust-me PDF into a verifiable, confidential on-chain primitive. Built on iExec Nox."

Show the repo URL and the `@iEx_ec` tag.

---

**Recording tips**
- Eight beats with live transactions is a lot for four minutes. Pre-mint tUSDC and pre-approve before you start rolling, and speed-ramp every confirmation wait. If you're over, cut the optional *Credit confidentially* step first, then the Etherscan tab.
- Pre-unlock MetaMask so popups appear instantly.
- If *Publish verdict* 404s briefly, that's the TEE gateway syncing — wait ~5s; the SDK auto-retries. Show the "computing in the TEE…" state rather than cutting.
- The faucet caps a single mint at 1,000,000 tokens, so keep demo amounts small. `mint(to, amount)` is deployer-only now — seed a second customer account from the operator wallet before recording, not on camera.
- Say "amount" rather than "number" when describing what's hidden. The customer *count*, the addresses, and the attestation ids are all public by design, and a sharp viewer will notice if you overclaim.

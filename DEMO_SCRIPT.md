# Demo script (≤ 4 minutes)

Goal: show a real, working confidential proof-of-solvency on Sepolia — numbers stay hidden, the verdict is public and verifiable. Keep it tight.

**Setup before recording:** contracts deployed to Sepolia; frontend running (Vercel or local); MetaMask with 2 accounts (Operator = deployer, Customer). Have Etherscan open in a tab.

---

### 0:00 – 0:25 · The problem
> "After FTX, every exchange is asked to prove reserves ≥ liabilities. But real proof leaks every customer's balance and the firm's whole book. So they publish nothing, or a PDF you can't verify. Solvent fixes that — it proves solvency on-chain **without revealing a single number**, using iExec Nox confidential compute."

Show the **Dashboard**: big verdict area, reserves/liabilities shown as `🔒 hidden`.

### 0:25 – 1:15 · Customer deposits (real token, encrypted claim)
- Switch to **Customer** tab. *Get test USDC* → *Approve & Deposit* (e.g. 100).
- "That was a real ERC-20 deposit. My claim is now stored **encrypted** — watch."
- Click **Decrypt my balance** → sign → shows *your* number.
- "Only I — and the auditor — can decrypt this. No one else, not even other customers."

### 1:15 – 2:15 · Operator runs the proof
- Switch to **Operator** (Operator account; mention it can be a **Safe** multisig).
- *Set encrypted reserves* (e.g. 1,000,000) — "encrypted client-side before it ever hits chain."
- (Optional) *Credit confidentially* to a customer — "balances can diverge from public deposits, fully privately."
- **1 · Attest solvency** — "this computes `reserves ≥ liabilities` **inside the TEE**."
- **2 · Publish verdict** — "the TEE returns a signed proof of just the boolean; the contract verifies it on-chain."

### 2:15 – 3:00 · The reveal
- Back to **Dashboard** → **✅ SOLVENT @ block N**, numbers still `🔒 hidden`.
- Open the contract on **Etherscan** → scroll events/state: "Notice — the verdict is here, but **no amount appears anywhere**. Reserves, liabilities, balances: all encrypted handles."

### 3:00 – 3:40 · Selective disclosure
- **Auditor** tab (auditor account) → **Decrypt totals** → real reserves & liabilities appear.
- "The auditor holds a Nox viewer key — compliance-grade disclosure to exactly one party, no one else."

### 3:40 – 4:00 · Close
> "Real token, real TEE, live on Sepolia. Solvent turns proof-of-reserves from a trust-me PDF into a verifiable, confidential on-chain primitive. Built on iExec Nox."

Show repo URL + `@iEx_ec` tag.

---

**Recording tips**
- Pre-mint/pre-approve to avoid waiting on confirmations on camera; or speed-ramp the wait.
- Keep MetaMask popups snappy — pre-unlock the wallet.
- If `Publish verdict` 404s briefly (TEE sync), wait ~5s and retry; the SDK auto-retries.

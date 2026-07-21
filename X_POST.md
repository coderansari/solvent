# X (Twitter) submission post — draft

> Requirements: short description + demo video + public GitHub link + tag @iEx_ec.

---

**Main tweet**

🔒 Introducing **Solvent** — confidential Proof-of-Reserves on-chain.

Prove `reserves ≥ liabilities` to the world **without revealing a single number**. The comparison runs inside an @iEx_ec #Nox TEE; only the ✅/❌ verdict is published.

Live on ETH Sepolia. Real token, real TEE, no mock data.

🧵👇

---

**Reply 1**

The post-FTX problem: everyone wants proof of reserves, but honest proof leaks every customer balance + your whole book.

Solvent keeps balances, totals & reserves encrypted. Customers decrypt only their own balance; an auditor gets a viewer key; the public sees only the verdict.

---

**Reply 2**

How it works:
• deposit → encrypted per-customer claim
• operator sets encrypted reserves
• attest() → `ge(reserves, liabilities)` in the TEE → encrypted boolean
• publish → gateway-signed proof verified on-chain → ✅ SOLVENT

No plaintext amount ever touches the chain.

---

**Reply 3**

Built on @iEx_ec Nox — modifies no underlying protocol, operator can be a Safe multisig. Zero custom cryptography; all encrypted math via the Nox Solidity lib.

🎥 Demo: <VIDEO_LINK>
💻 Code: <GITHUB_LINK>

#ConfidentialDeFi #WTFHackathon

---

**Checklist before posting**
- [ ] Video ≤ 4 min, uploaded
- [ ] GitHub repo public + builds
- [ ] `@iEx_ec` tagged in the main tweet
- [ ] Joined the iExec Discord WTF channel
- [ ] Links filled in (video + repo + live Vercel URL)

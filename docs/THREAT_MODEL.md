# Threat model & privacy guarantees

Solvent's goal: let an operator prove **`reserves ≥ liabilities`** to anyone, while keeping the underlying figures confidential, and let each stakeholder see exactly what they're entitled to — no more.

## What is private 🔒
- **Per-customer balances** (`_claims`) — decryptable only by the customer and the auditor (Nox ACL / viewer key).
- **Total liabilities** and **total reserves** — decryptable only by the operator and the auditor.
- **Confidential adjustments** (`operatorCredit`) — the delta is an encrypted input; only the resulting handle is stored.
- **Confidential deposit amounts** (`depositConfidential` via the ERC-7984 `ConfidentialUSDC`) — the deposited amount is an encrypted input pulled with `confidentialTransferFrom`; it never appears in calldata or events, not even at the token layer.
- The **arithmetic and comparison** all happen inside the TEE on ciphertext; no operand is exposed.

## What is public 🌐
- The **boolean verdict** of each attestation once published (`✅ Solvent` / `❌ Insolvent`), plus its block/timestamp.
- The **set of participating addresses** and the **customer count** (from `Deposited` events — addresses only, never amounts).
- The **liabilities Merkle root** committed at each attestation (a 32-byte hash; reveals no amounts).
- **Public ERC-20 deposit amounts** at the moment of the *public* `deposit()` path (`TestUSDC`). The confidential path (`ConfidentialUSDC` + `depositConfidential`) removes this exposure — see below.

## Proof-of-inclusion (Merkle)
At attestation time the vault commits a Merkle root over `(customer, encrypted-balance-handle)` leaves. Any party rebuilds the identical tree from public on-chain state (`Deposited`/`CustomerCredited` events + `confidentialClaimOf`) and calls `verifyInclusion` to prove *their own* balance was counted in the attested liabilities — **without revealing any amount**. This upgrades the guarantee from "trust the boolean" to "verify you were included". Binding the leaf-set sum cryptographically to the encrypted total (a ZK sum proof) is future work; today the encrypted `_totalLiabilities` used in the `≥` check and the committed leaf-set are both derived from the same on-chain deposit/credit operations.

## The deposit-visibility boundary
Two deposit paths exist:
- **Public path** (`deposit()` on `TestUSDC`) — a plain ERC-20 `transferFrom` reveals its amount on-chain. Retained for a clear side-by-side demo.
- **Confidential path** (`depositConfidential()` on `ConfidentialUSDC`, ERC-7984) — the amount is encrypted end-to-end; only the public **faucet mint** (the fiat/on-ramp analogue) is visible. This is the recommended path and closes the previous caveat.

Either way, the sensitive quantity — *what the operator owes each customer right now, and in aggregate* — always stays encrypted, which is the hard part of proof-of-liabilities.

**Future work:** a ZK sum proof binding the Merkle leaf-set to the encrypted total; a shielded settlement pool so even the faucet/on-ramp boundary is hidden.

## Trust assumptions
- **TEE integrity.** Confidentiality and correct computation rest on the Intel-TDX TEE operated by the Nox network and its attestation. Solvent inherits Nox's trust model.
- **Gateway signature.** `publishVerdict` accepts a verdict only with a valid gateway-signed decryption proof, verified on-chain by `NoxCompute`. A wrong/forged proof is rejected.
- **Operator honesty about reserves.** `_reserves` is operator-declared. Solvent proves the *relationship* `reserves ≥ liabilities` confidentially; it does not by itself prove the operator actually custodies those reserves. Pairing reserves with attested/− on-chain-held balances (e.g. a Safe's holdings) is a natural extension.
- **Auditor key custody.** The auditor address can decrypt totals; treat it as a privileged role.

## Non-goals
- Anonymity (addresses and calls are visible; only amounts are confidential).
- Hiding the *existence* of attestations or participants.
- Mainnet-grade economic guarantees (this is a Sepolia hackathon build).

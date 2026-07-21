# Threat model & privacy guarantees

Solvent's goal: let an operator prove **`reserves ≥ liabilities`** to anyone, while keeping the underlying figures confidential, and let each stakeholder see exactly what they're entitled to — no more.

## What is private 🔒
- **Per-customer balances** (`_claims`) — decryptable only by the customer and the auditor (Nox ACL / viewer key).
- **Total liabilities** and **total reserves** — decryptable only by the operator and the auditor.
- **Confidential adjustments** (`operatorCredit`) — the delta is an encrypted input; only the resulting handle is stored.
- The **arithmetic and comparison** all happen inside the TEE on ciphertext; no operand is exposed.

## What is public 🌐
- The **boolean verdict** of each attestation once published (`✅ Solvent` / `❌ Insolvent`), plus its block/timestamp.
- The **set of participating addresses** and the **customer count** (from `Deposited` events — addresses only, never amounts).
- **ERC-20 deposit amounts** at the moment of `deposit()`. A plain ERC-20 `transferFrom` reveals its amount on-chain; this is inherent to the public token, not to Solvent. See below.

## The deposit-visibility caveat
Because deposits use a public ERC-20, the amount of each individual `deposit()` call is visible in that transaction. Solvent's confidentiality therefore covers:
- the **running balance** of each customer (which diverges from deposits after any `operatorCredit`),
- the **aggregate** total liabilities and reserves,
- the **comparison result** beyond the single boolean.

It does **not** hide the raw deposit events themselves. In a production deployment the sensitive quantity — *what the operator owes each customer right now, and in aggregate* — is exactly what stays encrypted, which is the hard part of proof-of-liabilities.

**Future work:** fully-confidential deposits via an encrypted-input settlement path (accept `externalEuint256` and reconcile against a shielded pool) so even individual deposit amounts are hidden.

## Trust assumptions
- **TEE integrity.** Confidentiality and correct computation rest on the Intel-TDX TEE operated by the Nox network and its attestation. Solvent inherits Nox's trust model.
- **Gateway signature.** `publishVerdict` accepts a verdict only with a valid gateway-signed decryption proof, verified on-chain by `NoxCompute`. A wrong/forged proof is rejected.
- **Operator honesty about reserves.** `_reserves` is operator-declared. Solvent proves the *relationship* `reserves ≥ liabilities` confidentially; it does not by itself prove the operator actually custodies those reserves. Pairing reserves with attested/− on-chain-held balances (e.g. a Safe's holdings) is a natural extension.
- **Auditor key custody.** The auditor address can decrypt totals; treat it as a privileged role.

## Non-goals
- Anonymity (addresses and calls are visible; only amounts are confidential).
- Hiding the *existence* of attestations or participants.
- Mainnet-grade economic guarantees (this is a Sepolia hackathon build).

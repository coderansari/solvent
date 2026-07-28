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

## Bounded inputs (why the encrypted accumulator can't overflow)
Encrypted arithmetic can't revert on a condition it only ever sees as ciphertext: if `_totalLiabilities` wrapped past 2²⁵⁶ it would become a small number and the vault would report `Solvent` with enormous real liabilities, and the contract could not detect the carry to reject it. `Nox.safeAdd` returns an encrypted carry flag, which leaves the same problem one step further along — there is nothing actionable to branch on without decrypting.

So the domain is bounded in public Solidity, where the check is free: both faucets cap a single mint at 1,000,000 tokens (`TestUSDC.MAX_MINT`, `ConfidentialUSDC.MAX_MINT`) and `deposit()` caps a single deposit (`SolventVault.MAX_DEPOSIT`). `TestUSDC.mint` is deployer-only. The same caps close a griefing vector: with an unbounded faucet anyone could mint freely, deposit, and inflate liabilities past declared reserves to force every future verdict to `Insolvent`.

`attest()` additionally reverts `ReservesNotSet` until reserves are declared — an uninitialized handle is `bytes32(0)`, which Nox resolves to the typed *zero* handle, so an unguarded fresh vault would compute `0 >= 0` and publish a vacuous `Solvent`.

## Trust assumptions
- **TEE integrity.** Confidentiality and correct computation rest on the Intel-TDX TEE operated by the Nox network and its attestation. Solvent inherits Nox's trust model.
- **Gateway signature.** `publishVerdict` accepts a verdict only with a valid gateway-signed decryption proof, verified on-chain by `NoxCompute`. A wrong/forged proof is rejected.
- **Operator honesty about reserves.** `_reserves` is operator-declared. Solvent proves the *relationship* `reserves ≥ liabilities` confidentially; it does not by itself prove the operator actually custodies those reserves. Pairing reserves with attested/− on-chain-held balances (e.g. a Safe's holdings) is a natural extension.
- **Auditor key custody.** The auditor address can decrypt totals; treat it as a privileged role.
- **Operator rotation is not retroactive.** `setOperator` re-grants the live totals to the incoming operator, but Nox exposes no permanent revoke (only `disallowTransient`), so the outgoing operator retains access to the *handles that existed at rotation*. The next mutation supersedes them with handles it was never granted, so access ages out rather than persisting.

## Non-goals
- Anonymity (addresses and calls are visible; only amounts are confidential).
- Hiding the *existence* of attestations or participants.
- Mainnet-grade economic guarantees (this is a Sepolia hackathon build).
- **Withdrawals.** The vault is deposit-only by design for this build: there is no path that moves the underlying ERC-20 or ERC-7984 back out. Supporting it means encrypted subtraction plus a `select`-gated sufficiency check, and liabilities that can decrease — a materially larger design than the attestation flow this project demonstrates. Deposited testnet tokens are not recoverable.
- **Durable inclusion proofs.** `verifyInclusion` checks a customer's *current* claim handle against a past root, so a proof must be produced before the next deposit or credit changes that handle. Inclusion is verifiable at attestation time, not reconstructible as historical evidence afterwards. Binding leaves to a block-scoped snapshot would fix this and is future work alongside the ZK sum proof.


# Architecture

Solvent layers a confidential solvency proof on top of real, public ERC-20 holdings using the iExec **Nox** confidential-compute layer. It modifies no underlying protocol; the operator may be a **Safe** multisig.

## Components

### `SolventVault.sol`
The confidential ledger + attestation engine. Uses only the audited `Nox` library for encrypted math and access control.

| State | Type | Meaning |
|-------|------|---------|
| `_claims[addr]` | `euint256` | Encrypted per-customer balance (a liability of the operator) |
| `_totalLiabilities` | `euint256` | Encrypted running sum of all claims |
| `_reserves` | `euint256` | Operator-declared encrypted reserves |
| `attestations[]` | struct | `{ ebool verdict; blockNumber; timestamp; published; solvent }` |

Encrypted values never live on-chain — the chain stores 32-byte **handles** and an on-chain **ACL**; the plaintext lives in the Nox TEE. Compute ops (`add`, `ge`, …) are state-changing calls to **NoxCompute** (`0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF` on Sepolia).

### `TestUSDC.sol`
A 6-decimal ERC-20 with an open faucet so the flow runs on a real token (no mock data).

### Nox TEE gateway (off-chain, iExec-hosted)
`https://gateway-testnets.noxprotocol.dev` — performs the confidential computation and issues **input proofs** (EIP-712, for `fromExternal`) and **decryption proofs** (`signature ‖ plaintext`, for `publicDecrypt`). Solvent runs no backend of its own.

### Frontend
Next.js + ethers v6 + `@iexec-nox/handle`. `createEthersHandleClient(signer)` → `encryptInput / decrypt / publicDecrypt`. Reads addresses from `frontend/deployments/sepolia.json`.

## Key flows

**Deposit**
```
safeTransferFrom(user → vault, amount)
_claims[user]      = add(_claims[user], toEuint256(amount))
_totalLiabilities  = add(_totalLiabilities, toEuint256(amount))
re-grant ACL: allowThis + allow(owner) [+ addViewer(auditor)]
```

**Attest**
```
ebool solvent = ge(_reserves, _totalLiabilities)
allowThis(solvent); allowPublicDecryption(solvent)
push Attestation{ verdict: solvent, … }
```

**Publish (permissionless)**
```
frontend: { decryptionProof } = handleClient.publicDecrypt(verdictHandle)   // gateway
on-chain:  bool solvent = Nox.publicDecrypt(verdict, decryptionProof)        // verifies gateway sig
           store solvent + emit SolvencyPublished
```

**Selective disclosure**
- Customer → `decrypt(confidentialClaimOf(me))` (allowed via `allow`)
- Auditor → `decrypt(_reserves / _totalLiabilities)` (allowed via `addViewer`)
- Anyone → `publicDecrypt(verdict)`

## ACL discipline
Nox access clears at end-of-tx. Every stored handle is re-granted (`allowThis` + `allow(owner)` + `addViewer(auditor)`) after **every** mutation, via the private `_grantBalance` / `_grantTotal` helpers. Skipping this is the documented "#1 Nox bug."

## Build config
Solidity `0.8.35`, optimizer 200 runs, `evmVersion: "cancun"` (transient storage). Chain: Ethereum Sepolia (11155111).

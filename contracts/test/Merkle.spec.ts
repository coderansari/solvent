import { expect } from "chai";
import { ethers } from "hardhat";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

// The Merkle inclusion path in SolventVault is pure keccak (no Nox), so it is fully
// testable on the local Hardhat network. We build a StandardMerkleTree in JS exactly
// as the frontend will, then assert:
//   1. SolventVault.leafFor matches the JS tree's leaf hash (leaf convention is identical),
//   2. an on-chain harness mirroring the vault's verify logic accepts valid proofs and
//      rejects tampered ones (valid + negative cases).
describe("SolventVault — Merkle proof-of-inclusion", () => {
  const LEAF_ENCODING = ["address", "bytes32"];

  async function fixture() {
    const signers = await ethers.getSigners();
    // (customer, balanceHandle) entries — handles are opaque bytes32, like Nox euint256 handles.
    const entries: [string, string][] = signers.slice(0, 5).map((s, i) => [
      s.address,
      ethers.hexlify(ethers.randomBytes(32)),
    ]);
    const tree = StandardMerkleTree.of(entries, LEAF_ENCODING);

    const usdc = await (await ethers.getContractFactory("TestUSDC")).deploy();
    const [op, aud] = signers;
    const vault = await (await ethers.getContractFactory("SolventVault")).deploy(
      await usdc.getAddress(),
      op.address,
      aud.address,
      ethers.ZeroAddress
    );
    const harness = await (await ethers.getContractFactory("MerkleHarness")).deploy();
    await harness.setRoot(tree.root);
    return { tree, entries, vault, harness };
  }

  it("leafFor matches the StandardMerkleTree leaf hash", async () => {
    const { tree, entries, vault } = await fixture();
    for (const [customer, handle] of entries) {
      expect(await vault.leafFor(customer, handle)).to.equal(
        tree.leafHash([customer, handle])
      );
    }
  });

  it("vault.leafFor and harness.leafFor agree", async () => {
    const { entries, vault, harness } = await fixture();
    const [customer, handle] = entries[0];
    expect(await vault.leafFor(customer, handle)).to.equal(
      await harness.leafFor(customer, handle)
    );
  });

  it("accepts a valid inclusion proof for every customer", async () => {
    const { tree, harness } = await fixture();
    for (const [i, [customer, handle]] of [...tree.entries()]) {
      const proof = tree.getProof(i);
      expect(await harness.verifyInclusion(customer, handle, proof)).to.equal(true);
    }
  });

  it("rejects a proof for the wrong handle", async () => {
    const { tree, harness, entries } = await fixture();
    const proof = tree.getProof(0);
    const [customer] = entries[0];
    const wrongHandle = ethers.hexlify(ethers.randomBytes(32));
    expect(await harness.verifyInclusion(customer, wrongHandle, proof)).to.equal(false);
  });

  it("rejects a tampered proof", async () => {
    const { tree, harness, entries } = await fixture();
    const [customer, handle] = entries[0];
    const proof = tree.getProof(0);
    const tampered = [...proof];
    tampered[0] = ethers.hexlify(ethers.randomBytes(32));
    expect(await harness.verifyInclusion(customer, handle, tampered)).to.equal(false);
  });

  it("rejects an empty proof against a multi-leaf root", async () => {
    const { harness, entries } = await fixture();
    const [customer, handle] = entries[0];
    expect(await harness.verifyInclusion(customer, handle, [])).to.equal(false);
  });
});

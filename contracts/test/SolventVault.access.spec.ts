import { expect } from "chai";
import { ethers } from "hardhat";

// These tests cover the NON-encrypted logic of SolventVault: access control,
// zero-address guards, id bounds, and operator rotation. They deliberately call
// operator-only functions from a NON-operator so the `onlyOperator` check reverts
// FIRST — before any `Nox.*` call. Nox operations require the live coprocessor and
// revert on a local Hardhat network, so the encrypted paths are covered by the
// Sepolia integration script (scripts/smoke.ts), not here.
describe("SolventVault — access control & guards", () => {
  const ZERO32 = "0x" + "0".repeat(64);
  const EMPTY = "0x";

  async function deploy() {
    const [operator, auditor, outsider, customer] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("TestUSDC")).deploy();
    const vault = await (await ethers.getContractFactory("SolventVault")).deploy(
      await usdc.getAddress(),
      operator.address,
      auditor.address,
      ethers.ZeroAddress // confidentialAsset — set on Sepolia
    );
    return { usdc, vault, operator, auditor, outsider, customer };
  }

  it("constructor wires asset/operator/auditor", async () => {
    const { usdc, vault, operator, auditor } = await deploy();
    expect(await vault.asset()).to.equal(await usdc.getAddress());
    expect(await vault.operator()).to.equal(operator.address);
    expect(await vault.auditor()).to.equal(auditor.address);
  });

  it("constructor reverts on zero asset or zero operator", async () => {
    const [operator, auditor] = await ethers.getSigners();
    const F = await ethers.getContractFactory("SolventVault");
    await expect(
      F.deploy(ethers.ZeroAddress, operator.address, auditor.address, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(F, "ZeroAddress");
    const usdc = await (await ethers.getContractFactory("TestUSDC")).deploy();
    await expect(
      F.deploy(await usdc.getAddress(), ethers.ZeroAddress, auditor.address, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(F, "ZeroAddress");
  });

  it("onlyOperator functions revert for a non-operator", async () => {
    const { vault, outsider, customer } = await deploy();
    const v = vault.connect(outsider);
    await expect(v.setReserves(ZERO32, EMPTY)).to.be.revertedWithCustomError(vault, "NotOperator");
    await expect(
      v.operatorCredit(customer.address, ZERO32, EMPTY)
    ).to.be.revertedWithCustomError(vault, "NotOperator");
    await expect(v.attest(ZERO32)).to.be.revertedWithCustomError(vault, "NotOperator");
    await expect(v.setAuditor(outsider.address)).to.be.revertedWithCustomError(vault, "NotOperator");
    await expect(v.setOperator(outsider.address)).to.be.revertedWithCustomError(vault, "NotOperator");
  });

  it("operatorCredit to the zero address reverts ZeroAddress (before any Nox call)", async () => {
    const { vault, operator } = await deploy();
    await expect(
      vault.connect(operator).operatorCredit(ethers.ZeroAddress, ZERO32, EMPTY)
    ).to.be.revertedWithCustomError(vault, "ZeroAddress");
  });

  it("setOperator to the zero address reverts ZeroAddress", async () => {
    const { vault, operator } = await deploy();
    await expect(
      vault.connect(operator).setOperator(ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(vault, "ZeroAddress");
  });

  it("setOperator rotates the role and emits", async () => {
    const { vault, operator, outsider } = await deploy();
    await expect(vault.connect(operator).setOperator(outsider.address))
      .to.emit(vault, "OperatorUpdated")
      .withArgs(outsider.address);
    expect(await vault.operator()).to.equal(outsider.address);
    // old operator is now powerless
    await expect(vault.connect(operator).attest(ZERO32)).to.be.revertedWithCustomError(
      vault,
      "NotOperator"
    );
  });

  it("publishVerdict / latestAttestation revert InvalidAttestation when empty", async () => {
    const { vault } = await deploy();
    expect(await vault.attestationsCount()).to.equal(0);
    await expect(vault.publishVerdict(0, EMPTY)).to.be.revertedWithCustomError(
      vault,
      "InvalidAttestation"
    );
    await expect(vault.latestAttestation()).to.be.revertedWithCustomError(
      vault,
      "InvalidAttestation"
    );
  });

  it("verifyInclusion reverts InvalidAttestation for an out-of-range id", async () => {
    const { vault, customer } = await deploy();
    await expect(
      vault.verifyInclusion(0, customer.address, ZERO32, [])
    ).to.be.revertedWithCustomError(vault, "InvalidAttestation");
  });

  it("depositConfidential reverts NotConfidentialAsset when no confidential token is set", async () => {
    const { vault } = await deploy();
    // confidentialAsset is the zero address in unit tests.
    await expect(vault.depositConfidential(ZERO32, EMPTY)).to.be.revertedWithCustomError(
      vault,
      "NotConfidentialAsset"
    );
  });
});

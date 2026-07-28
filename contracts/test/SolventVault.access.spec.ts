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

  // Regression: an uninitialized `_reserves` handle is bytes32(0), which
  // Nox._resolveUndefinedHandle maps to the typed ZERO handle. Without the guard,
  // `ge(0, 0)` is true and a vault that never set reserves would publish a vacuous
  // `Solvent` verdict. The guard fires before any Nox call, so it is testable locally.
  it("attest reverts ReservesNotSet before reserves are declared", async () => {
    const { vault, operator } = await deploy();
    await expect(vault.connect(operator).attest(ZERO32)).to.be.revertedWithCustomError(
      vault,
      "ReservesNotSet"
    );
    expect(await vault.attestationsCount()).to.equal(0);
  });

  // Regression: bounds the encrypted liability accumulator well below 2**256, where a
  // wrap would silently flip the verdict to `Solvent`. Checked before safeTransferFrom.
  it("deposit reverts AmountTooLarge above MAX_DEPOSIT", async () => {
    const { vault, customer } = await deploy();
    const cap = await vault.MAX_DEPOSIT();
    await expect(
      vault.connect(customer).deposit(cap + 1n)
    ).to.be.revertedWithCustomError(vault, "AmountTooLarge");
    await expect(
      vault.connect(customer).deposit(ethers.MaxUint256)
    ).to.be.revertedWithCustomError(vault, "AmountTooLarge");
  });

  // setOperator now re-grants the live totals to the incoming operator. On a fresh vault
  // both handles are uninitialized, so the isInitialized guards skip the Nox calls and the
  // rotation still works locally. The grant itself needs the live coprocessor — covered on
  // Sepolia by scripts/smoke.ts.
  it("setOperator rotates without touching Nox while handles are uninitialized", async () => {
    const { vault, operator, outsider } = await deploy();
    await expect(vault.connect(operator).setOperator(outsider.address)).to.emit(
      vault,
      "OperatorUpdated"
    );
    expect(await vault.operator()).to.equal(outsider.address);
  });
});

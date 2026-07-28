import { expect } from "chai";
import { ethers } from "hardhat";

describe("TestUSDC", () => {
  async function deploy() {
    const [a, b] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("TestUSDC")).deploy();
    return { usdc, a, b };
  }

  it("has 6 decimals and the tUSDC symbol", async () => {
    const { usdc } = await deploy();
    expect(await usdc.decimals()).to.equal(6);
    expect(await usdc.symbol()).to.equal("tUSDC");
  });

  it("faucet mints to the caller", async () => {
    const { usdc, b } = await deploy();
    const amt = 1_000_000n; // 1 tUSDC
    await usdc.connect(b).faucet(amt);
    expect(await usdc.balanceOf(b.address)).to.equal(amt);
  });

  it("mint mints to an arbitrary account", async () => {
    const { usdc, a, b } = await deploy();
    const amt = 500_000n;
    await usdc.connect(a).mint(b.address, amt);
    expect(await usdc.balanceOf(b.address)).to.equal(amt);
  });

  // Regression: an uncapped faucet let anyone inflate SolventVault's encrypted
  // `_totalLiabilities` — griefing every verdict to `Insolvent`, and at extreme values
  // wrapping the accumulator past 2**256 so it would read `Solvent` instead.
  it("faucet rejects amounts above MAX_MINT", async () => {
    const { usdc, b } = await deploy();
    const cap = await usdc.MAX_MINT();
    await expect(usdc.connect(b).faucet(cap + 1n)).to.be.revertedWithCustomError(
      usdc,
      "AmountTooLarge"
    );
    await expect(usdc.connect(b).faucet(ethers.MaxUint256)).to.be.revertedWithCustomError(
      usdc,
      "AmountTooLarge"
    );
    // the cap itself is allowed
    await usdc.connect(b).faucet(cap);
    expect(await usdc.balanceOf(b.address)).to.equal(cap);
  });

  it("mint is deployer-only and capped", async () => {
    const { usdc, a, b } = await deploy();
    await expect(usdc.connect(b).mint(b.address, 1n)).to.be.revertedWithCustomError(
      usdc,
      "NotOwner"
    );
    const cap = await usdc.MAX_MINT();
    await expect(usdc.connect(a).mint(b.address, cap + 1n)).to.be.revertedWithCustomError(
      usdc,
      "AmountTooLarge"
    );
    expect(await usdc.owner()).to.equal(a.address);
  });
});

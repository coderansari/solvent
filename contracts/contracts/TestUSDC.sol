// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestUSDC
 * @notice A 6-decimal test stablecoin with an open faucet so anyone can obtain
 *         tokens on Sepolia and exercise Solvent end-to-end. Real on-chain ERC-20,
 *         not mock data — the confidential ledger is built on genuine token transfers.
 *
 * @dev The faucet is deliberately capped. An unbounded testnet faucet would let anyone
 *      mint an arbitrary supply, deposit it, and inflate the vault's encrypted
 *      `_totalLiabilities` — griefing every future verdict into `Insolvent`, and at
 *      extreme values wrapping the accumulator past 2**256 so the vault would instead
 *      report `Solvent`. Encrypted arithmetic cannot revert on an overflow it only ever
 *      sees as ciphertext, so the input domain is bounded here in public Solidity, where
 *      the check costs nothing.
 */
contract TestUSDC is ERC20 {
    /// @notice Largest amount a single faucet or mint call may create (1,000,000 tUSDC).
    uint256 public constant MAX_MINT = 1_000_000 * 10 ** 6;

    /// @notice Deployer — the only account permitted to mint to an arbitrary address.
    address public immutable owner;

    error AmountTooLarge();
    error NotOwner();

    constructor() ERC20("Test USD Coin", "tUSDC") {
        owner = msg.sender;
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint up to {MAX_MINT} (6-decimals) to the caller. Testnet convenience faucet.
    function faucet(uint256 amount) external {
        if (amount > MAX_MINT) revert AmountTooLarge();
        _mint(msg.sender, amount);
    }

    /// @notice Mint up to {MAX_MINT} to an arbitrary account. Deployer only, so demo
    ///         customers can be seeded without handing out a private key.
    function mint(address to, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        if (amount > MAX_MINT) revert AmountTooLarge();
        _mint(to, amount);
    }
}

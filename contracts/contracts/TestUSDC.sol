// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestUSDC
 * @notice A 6-decimal test stablecoin with an open faucet so anyone can obtain
 *         tokens on Sepolia and exercise Solvent end-to-end. Real on-chain ERC-20,
 *         not mock data — the confidential ledger is built on genuine token transfers.
 */
contract TestUSDC is ERC20 {
    constructor() ERC20("Test USD Coin", "tUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint `amount` (6-decimals) to the caller. Testnet convenience faucet.
    function faucet(uint256 amount) external {
        _mint(msg.sender, amount);
    }

    /// @notice Mint `amount` to an arbitrary address (testnet convenience).
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

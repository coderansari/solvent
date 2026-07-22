// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol";
import {Nox, euint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

/**
 * @title ConfidentialUSDC
 * @notice A 6-decimal confidential test token (ERC-7984) for Solvent. Balances and
 *         transfer amounts are encrypted end-to-end. The only public boundary is the
 *         open testnet `faucet`, which mints a caller-chosen amount — after that, every
 *         transfer (including deposits into the vault) hides its amount.
 *
 * @dev Deposits into {SolventVault} are made with
 *      `confidentialTransferAndCall(vault, encryptedAmount, inputProof, "")`, which moves
 *      the encrypted amount and invokes the vault's {IERC7984Receiver} callback.
 */
contract ConfidentialUSDC is ERC7984 {
    constructor() ERC7984("Confidential USD Coin", "cUSDC", "") {}

    /// @notice ERC-7984 recommends 6 decimals; override the base default of 18.
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Open testnet faucet — mints `amount` (public) confidential tokens to the caller.
     *         This mint is the documented public on-ramp; all subsequent transfers are encrypted.
     */
    function faucet(uint256 amount) external {
        _mint(msg.sender, Nox.toEuint256(amount));
    }
}

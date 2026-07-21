// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    Nox,
    euint256,
    externalEuint256,
    ebool
} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

/**
 * @title SolventVault
 * @notice Confidential Proof-of-Reserves-&-Liabilities on iExec Nox.
 *
 * An operator (an exchange, fund, or DAO treasury — which may be a Safe multisig)
 * maintains a confidential ledger:
 *   - each customer holds an encrypted claim (a liability of the operator),
 *   - the operator declares encrypted total reserves,
 *   - `attest()` computes `reserves >= totalLiabilities` INSIDE the Nox TEE and
 *     yields an encrypted boolean verdict,
 *   - `publishVerdict()` reveals ONLY that boolean on-chain via a gateway-signed proof.
 *
 * Nobody learns the amounts. A customer may decrypt only their own claim (proving
 * inclusion); a nominated auditor may decrypt the totals; the public sees only the
 * verified `Solvent` / `Insolvent` verdict.
 *
 * All encrypted arithmetic, comparisons and access control are delegated to the
 * audited {Nox} library — this contract adds no cryptography of its own.
 */
contract SolventVault {
    using SafeERC20 for IERC20;

    // ------------------------------------------------------------------ //
    //                              Storage                               //
    // ------------------------------------------------------------------ //

    /// @notice The public ERC-20 whose deposits back the confidential ledger.
    IERC20 public immutable asset;

    /// @notice The party that maintains the ledger and attests solvency (may be a Safe).
    address public operator;

    /// @notice Optional auditor granted a viewer key over the confidential totals.
    address public auditor;

    /// @dev Per-customer encrypted balance (the operator's liability to them).
    mapping(address => euint256) private _claims;

    /// @dev Encrypted running sum of all customer claims.
    euint256 private _totalLiabilities;

    /// @dev Encrypted, operator-attested reserves (e.g. cold + hot wallets).
    euint256 private _reserves;

    struct Attestation {
        ebool verdict; // encrypted reserves >= liabilities
        uint64 blockNumber; // when it was attested
        uint64 timestamp;
        bool published; // whether the verdict has been publicly revealed
        bool solvent; // the revealed boolean (valid once published)
    }

    /// @notice History of solvency attestations.
    Attestation[] public attestations;

    // ------------------------------------------------------------------ //
    //                               Events                               //
    // ------------------------------------------------------------------ //

    // NOTE: events never carry amounts — only addresses and ids.
    event Deposited(address indexed customer);
    event CustomerCredited(address indexed customer);
    event ReservesUpdated();
    event AuditorUpdated(address indexed auditor);
    event OperatorUpdated(address indexed operator);
    event SolvencyAttested(uint256 indexed id, bytes32 verdictHandle, uint256 blockNumber);
    event SolvencyPublished(uint256 indexed id, bool solvent, uint256 blockNumber);

    // ------------------------------------------------------------------ //
    //                               Errors                               //
    // ------------------------------------------------------------------ //

    error NotOperator();
    error InvalidAttestation();
    error AlreadyPublished();
    error ZeroAddress();

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    constructor(IERC20 asset_, address operator_, address auditor_) {
        if (address(asset_) == address(0) || operator_ == address(0)) revert ZeroAddress();
        asset = asset_;
        operator = operator_;
        auditor = auditor_;
    }

    // ------------------------------------------------------------------ //
    //                              Deposits                              //
    // ------------------------------------------------------------------ //

    /**
     * @notice Deposit `amount` of the underlying ERC-20 and receive a confidential
     *         claim of equal value. The deposit amount is visible at the ERC-20 layer,
     *         but the resulting balance handle, all later adjustments, and every total
     *         are encrypted.
     */
    function deposit(uint256 amount) external {
        asset.safeTransferFrom(msg.sender, address(this), amount);

        euint256 amt = Nox.toEuint256(amount);

        euint256 newClaim = Nox.add(_claims[msg.sender], amt);
        _claims[msg.sender] = newClaim;
        _grantBalance(newClaim, msg.sender);

        euint256 newTotal = Nox.add(_totalLiabilities, amt);
        _totalLiabilities = newTotal;
        _grantTotal(newTotal);

        emit Deposited(msg.sender);
    }

    /**
     * @notice Operator-only confidential adjustment to a customer's balance (e.g. crediting
     *         trading PnL). Demonstrates that confidential balances diverge from the public
     *         deposit amounts. Accepts an encrypted delta with its input proof.
     */
    function operatorCredit(
        address customer,
        externalEuint256 encDelta,
        bytes calldata proof
    ) external onlyOperator {
        if (customer == address(0)) revert ZeroAddress();
        euint256 delta = Nox.fromExternal(encDelta, proof);

        euint256 newClaim = Nox.add(_claims[customer], delta);
        _claims[customer] = newClaim;
        _grantBalance(newClaim, customer);

        euint256 newTotal = Nox.add(_totalLiabilities, delta);
        _totalLiabilities = newTotal;
        _grantTotal(newTotal);

        emit CustomerCredited(customer);
    }

    // ------------------------------------------------------------------ //
    //                              Reserves                              //
    // ------------------------------------------------------------------ //

    /**
     * @notice Operator declares its encrypted total reserves. This models holdings
     *         spread across cold/hot wallets whose exact size must stay private.
     */
    function setReserves(
        externalEuint256 encReserves,
        bytes calldata proof
    ) external onlyOperator {
        euint256 r = Nox.fromExternal(encReserves, proof);
        _reserves = r;
        Nox.allowThis(r);
        Nox.allow(r, operator);
        if (auditor != address(0)) Nox.addViewer(r, auditor);
        emit ReservesUpdated();
    }

    // ------------------------------------------------------------------ //
    //                            Attestation                             //
    // ------------------------------------------------------------------ //

    /**
     * @notice Compute `reserves >= totalLiabilities` inside the TEE and mark the encrypted
     *         verdict publicly decryptable. Does not reveal any amount. Returns the new id.
     */
    function attest() external onlyOperator returns (uint256 id) {
        ebool solvent = Nox.ge(_reserves, _totalLiabilities);
        Nox.allowThis(solvent);
        Nox.allowPublicDecryption(solvent);

        id = attestations.length;
        attestations.push(
            Attestation({
                verdict: solvent,
                blockNumber: uint64(block.number),
                timestamp: uint64(block.timestamp),
                published: false,
                solvent: false
            })
        );

        emit SolvencyAttested(id, ebool.unwrap(solvent), block.number);
    }

    /**
     * @notice Reveal the verdict for attestation `id` using a gateway-issued decryption
     *         proof. Permissionless: the proof is self-verifying (checked on-chain against
     *         the Nox gateway signature). Only the boolean is ever revealed.
     */
    function publishVerdict(uint256 id, bytes calldata decryptionProof) external {
        if (id >= attestations.length) revert InvalidAttestation();
        Attestation storage a = attestations[id];
        if (a.published) revert AlreadyPublished();

        bool solvent = Nox.publicDecrypt(a.verdict, decryptionProof);
        a.published = true;
        a.solvent = solvent;

        emit SolvencyPublished(id, solvent, block.number);
    }

    // ------------------------------------------------------------------ //
    //                          Admin / config                            //
    // ------------------------------------------------------------------ //

    /// @notice Set (or rotate) the auditor and grant it viewer access to the totals.
    function setAuditor(address auditor_) external onlyOperator {
        auditor = auditor_;
        if (auditor_ != address(0)) {
            if (Nox.isInitialized(_reserves)) Nox.addViewer(_reserves, auditor_);
            if (Nox.isInitialized(_totalLiabilities)) Nox.addViewer(_totalLiabilities, auditor_);
        }
        emit AuditorUpdated(auditor_);
    }

    /// @notice Transfer the operator role (e.g. hand off to a Safe multisig).
    function setOperator(address operator_) external onlyOperator {
        if (operator_ == address(0)) revert ZeroAddress();
        operator = operator_;
        emit OperatorUpdated(operator_);
    }

    // ------------------------------------------------------------------ //
    //                               Views                                //
    // ------------------------------------------------------------------ //

    /// @notice Encrypted claim handle for `customer` (decryptable only by them / auditor).
    function confidentialClaimOf(address customer) external view returns (euint256) {
        return _claims[customer];
    }

    /// @notice Encrypted total-liabilities handle (decryptable only by operator / auditor).
    function confidentialTotalLiabilities() external view returns (euint256) {
        return _totalLiabilities;
    }

    /// @notice Encrypted reserves handle (decryptable only by operator / auditor).
    function confidentialReserves() external view returns (euint256) {
        return _reserves;
    }

    function attestationsCount() external view returns (uint256) {
        return attestations.length;
    }

    function latestAttestation() external view returns (Attestation memory) {
        if (attestations.length == 0) revert InvalidAttestation();
        return attestations[attestations.length - 1];
    }

    // ------------------------------------------------------------------ //
    //                        ACL helpers (critical)                      //
    // ------------------------------------------------------------------ //
    // Nox access clears at end-of-tx, so every stored handle MUST be re-granted
    // after each mutation, or it becomes inaccessible on the next transaction.

    function _grantBalance(euint256 bal, address owner) private {
        Nox.allowThis(bal);
        Nox.allow(bal, owner);
        if (auditor != address(0)) Nox.addViewer(bal, auditor);
    }

    function _grantTotal(euint256 total) private {
        Nox.allowThis(total);
        Nox.allow(total, operator);
        if (auditor != address(0)) Nox.addViewer(total, auditor);
    }
}

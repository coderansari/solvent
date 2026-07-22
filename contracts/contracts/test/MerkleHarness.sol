// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title MerkleHarness
 * @notice Test-only mirror of SolventVault's Merkle inclusion logic with a settable root.
 *         Lets the local suite exercise the exact `leafFor` + `MerkleProof.verify` code path
 *         without needing `attest()` (which requires the live Nox coprocessor). NOT deployed.
 */
contract MerkleHarness {
    bytes32 public root;

    function setRoot(bytes32 r) external {
        root = r;
    }

    function leafFor(address customer, bytes32 balanceHandle) public pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(customer, balanceHandle))));
    }

    function verifyInclusion(
        address customer,
        bytes32 balanceHandle,
        bytes32[] calldata proof
    ) external view returns (bool) {
        return MerkleProof.verify(proof, root, leafFor(customer, balanceHandle));
    }
}

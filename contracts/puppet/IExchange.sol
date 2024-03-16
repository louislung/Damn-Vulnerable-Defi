// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IExchange {
    function addLiquidity(
        uint256,
        uint256,
        uint256
    ) external payable returns (uint256);

    function tokenToEthSwapInput(
        uint256,
        uint256,
        uint256
    ) external returns (uint256);
}

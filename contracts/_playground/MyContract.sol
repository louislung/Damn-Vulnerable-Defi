// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";

/**
 * @title MyContract
 * @author Louis Law
 */
contract MyContract {
    uint256 public publicUint256;
    string public publicString;
    mapping(string => uint256) mapStringToUint256;
    mapping(string => string) mapStringToString;

    constructor() {
        publicUint256 = 100;
        publicString = "Hi";
    }

    // access state variable by this.xxx() inside function
    // this is possible because getter function is auto generated for public variable
    // https://docs.soliditylang.org/en/latest/contracts.html#getter-functions
    function accessStateVariable(uint256 publicUint256) public view {
        console.log("publicUint256", publicUint256);
        console.log("this.publicUint256()", this.publicUint256());
        console.log(
            "this.publicUint256() + publicUint256",
            this.publicUint256() + publicUint256
        );
    }

    // define variable in returns
    function implicitReturn(
        uint256 inputUint256
    ) public view returns (uint256 computed) {
        // computed is already defined in returns(), otherwise need to do uint256 computed here
        computed = inputUint256 + publicUint256;
    }

    function publicViewOnly() public view {}

    function publicOnly() public {}

    function mappingDefaultValue() public view {
        console.log('mapStringToUint256["hi"]', mapStringToUint256["hi"]); // default to zero
        console.log('mapStringToString["hi"]', mapStringToString["hi"]); // default to empty string
        console.log(
            'keccak256(abi.encodePacked((mapStringToString["hi"])) == keccak256(abi.encodePacked((""))',
            keccak256(abi.encodePacked((mapStringToString["hi"]))) ==
                keccak256(abi.encodePacked(("")))
        );
    }

    function delegateCall() public payable {
        showMsgDetail();
        bytes memory data = abi.encodeWithSignature("showMsgDetail()");
        address(this).delegatecall(data);
    }

    function showMsgDetail() public payable {
        console.log("MyContract/showMsgDetail", "msg.sender", msg.sender);
        console.log("msg.value", msg.value);
    }
}

contract MyStorage {
    string public constant iamconstant = "hello"; // no storage slot needed for constant
    // ​uint256 public constant iamconstant = 2;
    uint8 public a = 1; // slot 0
    uint8 public b = 2; // slot 0
    uint8 public c = 3; // slot 0
    uint8 public d = 4;
    uint8 public e = 5;
    uint8 public f = 6;
    uint8 public g = 7;
    uint8 public h = 8;
    uint8 public i = 9;
    uint8 public j = 10;
    uint8 public k = 11;
    uint8 public l = 12;
    uint8 public m = 13;
    uint8 public n = 14;
    uint8 public o = 15;
    uint8 public p = 16;
    uint8 public q = 17;
    uint8 public r = 18;
    uint8 public s = 19;
    uint8 public t = 20;
    address public owner; // slot1 as all above variables fit in slot0
    mapping(uint8 => uint8) uint8Touint8; //slot2
    mapping(string => string) stringTostring; //slot3

    constructor() {
        owner = msg.sender;
        uint8Touint8[0] = 1;
        uint8Touint8[1] = 2;
        stringTostring["hello"] = "world";
        stringTostring[
            "long"
        ] = "qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm"; // this string is longer than 32 bytes
    }
}

// https://solidity-by-example.org/library/
library Array {
    function remove(uint[] storage arr, uint index) public {
        // Move the last element into the place to delete
        require(arr.length > 0, "Can't remove from empty array");
        arr[index] = arr[arr.length - 1];
        arr.pop();
    }
}

contract TestArray {
    using Array for uint[];

    uint[] public arr;

    function testArrayRemove() public {
        for (uint i = 0; i < 3; i++) {
            arr.push(i);
        }

        arr.remove(1);

        assert(arr.length == 2);
        assert(arr[0] == 0);
        assert(arr[1] == 2);
    }

    function getArrayAddress() public pure returns (address) {
        return address(Array);
    }
}

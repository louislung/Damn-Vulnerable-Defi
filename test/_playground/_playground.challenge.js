const { ethers } = require('hardhat');
const { expect } = require('chai');
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe('Playground', function () {
    let deployer, player;
    let myContract;

    const TOKEN_INITIAL_SUPPLY = 2000000n * 10n ** 18n;
    const TOKENS_IN_POOL = 1500000n * 10n ** 18n;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, player] = await ethers.getSigners();

        myContract = await (await ethers.getContractFactory('MyContract', deployer)).deploy();
        MyStorage = await (await ethers.getContractFactory('MyStorage', deployer)).deploy();
        ArrayLibrary = await (await ethers.getContractFactory('Array', deployer)).deploy();
        TestArray = await (await ethers.getContractFactory('TestArray', {
            signer: deployer,
            libraries: {
                Array: ArrayLibrary.address,
            },
        })).deploy();
    });

    it('Execution', async function () {
        const abicoder = new ethers.utils.AbiCoder();

        console.log("--------------------------------------------------------------------");
        // access public variable like a function
        console.log("myContract.publicUint256():", await myContract.publicUint256());
        console.log("myContract.accessStateVariable():", await myContract.accessStateVariable(5n));
        console.log("--------------------------------------------------------------------");
        console.log("")

        console.log("--------------------------------------------------------------------");
        console.log("myContract.implicitReturn:", await myContract.implicitReturn(5));
        console.log("--------------------------------------------------------------------");
        console.log("")

        console.log("--------------------------------------------------------------------");
        // view function doesn't require a transaction
        console.log("myContract.publicViewOnly:", await myContract.publicViewOnly());
        console.log("myContract.publicOnly:", await myContract.publicOnly());
        console.log("--------------------------------------------------------------------");
        console.log("")

        console.log("--------------------------------------------------------------------");
        // for mapping, if the key is not defined, then it should default to 0x0 (as that storage slot is not initialized)
        console.log("myContract.mappingDefaultValue:", await myContract.mappingDefaultValue());
        console.log("--------------------------------------------------------------------");
        console.log("")

        console.log("--------------------------------------------------------------------");
        // call a view function using function selector
        iface = new ethers.utils.Interface(["function publicUint256()", "function publicString()"]);
        publicUint256_selector = iface.encodeFunctionData("publicUint256", []); // or iface.getSighash("publicUint256")
        console.log("publicUint256_selector", publicUint256_selector); // this is the function selector
        publicUint256 = await player.call({ to: myContract.address, data: publicUint256_selector });
        console.log("decode publicUint256", publicUint256, abicoder.decode(["uint256"], publicUint256)[0], abicoder.decode(["uint"], publicUint256)[0]);

        publicString = await player.call({ to: myContract.address, data: iface.getSighash("publicString") });
        console.log("decode publicString", publicString, abicoder.decode(["string"], publicString));
        console.log("--------------------------------------------------------------------");
        console.log("")

        console.log("--------------------------------------------------------------------");
        // storage layout https://docs.alchemy.com/docs/smart-contract-storage-layout
        slot0 = await ethers.provider.getStorageAt(MyStorage.address, 0);
        slot1 = await ethers.provider.getStorageAt(MyStorage.address, 1);
        slot2 = await ethers.provider.getStorageAt(MyStorage.address, 2);
        slot3 = await ethers.provider.getStorageAt(MyStorage.address, 3);
        console.log("slot0", slot0);
        console.log("slot1", slot1);
        console.log("slot2", slot2); // empty (zero) as this is slot for a mapping
        console.log("slot3", slot3); // empty (zero) as this is slot for a mapping

        // storage layout for Mapping
        //0 because key=0, 2 because mapping is at slot2
        slot_key0 = ethers.utils.keccak256(abicoder.encode(["uint", "uint"], [0, 2]));
        // slot_key0 = ethers.utils.keccak256(ethers.utils.solidityPack(["uint", "uint"], [0, 2])); // this is the same as above
        console.log("slot_key0", await ethers.provider.getStorageAt(MyStorage.address, slot_key0));
        //0 because key=1, 2 because mapping is at slot2
        slot_key1 = ethers.utils.keccak256(abicoder.encode(["uint", "uint"], [1, 2]));
        console.log("slot_key1", await ethers.provider.getStorageAt(MyStorage.address, slot_key1));

        // storage layout for String Mapping
        slot_keyhello = ethers.utils.keccak256(ethers.utils.hexConcat([ethers.utils.hexlify(ethers.utils.toUtf8Bytes('hello')), ethers.utils.hexZeroPad(3, 32)])) //because key="hello", 3 because mapping is at slot3
        // slot_keyhello = ethers.utils.keccak256(ethers.utils.solidityPack(["string", "uint"], ["hello", 3])) // same as above
        slot_keyhellow_value = await ethers.provider.getStorageAt(MyStorage.address, slot_keyhello);
        // note that last a in  slot_keyhellow_value indicate len(world)*2, it is not part of the sting
        // https://docs.soliditylang.org/en/v0.8.7/internals/layout_in_storage.html#bytes-and-string
        console.log("slot_keyhellow_value", slot_keyhellow_value, ethers.utils.toUtf8String(slot_keyhellow_value));
        slot_long = ethers.utils.keccak256(ethers.utils.solidityPack(["string", "uint"], ["long", 3]));
        slot_long_value = await ethers.provider.getStorageAt(MyStorage.address, slot_long);
        slot_long_value1 = await ethers.provider.getStorageAt(MyStorage.address, ethers.utils.keccak256(slot_long));
        slot_long_value2 = await ethers.provider.getStorageAt(MyStorage.address, ethers.utils.hexValue(BigInt(ethers.utils.keccak256(slot_long)) + 1n));
        console.log("slot_long_value", slot_long_value); // notice slot_long_value only store (len*2+1) as the string is more than 32 bytes
        console.log("slot_long_value12", slot_long_value1, slot_long_value2, ethers.utils.toUtf8String(ethers.utils.hexConcat([slot_long_value1, slot_long_value2])));
        console.log("--------------------------------------------------------------------");
        console.log("")

        console.log("--------------------------------------------------------------------");
        console.log("player", player.address)
        await myContract.connect(player).delegateCall({ value: 10n ** 10n });
        console.log("--------------------------------------------------------------------");
        console.log("")

        // a = web3.eth.abi.encodeFunctionsSignature("propseNewAdmin(address)");
        // b = web3.eth.abi.encodeParameters(["address"], [player]);
        // c = _ethers.utils.hecConcat([a, b]);
        // await web3.eth.sendTransaction(from: player, to: instance, data: c);

        // console.log(await ethers.provider.getCode(uniswapExchange.address)); <- what is this code

        console.log("--------------------------------------------------------------------");
        // get library address
        console.log("ArrayLibrary.address", ArrayLibrary.address, "TestArray.address", TestArray.address);
        console.log(await TestArray.getArrayAddress());
        // todo: how about library with public constant? like Errors.sol?
        console.log("--------------------------------------------------------------------");
        console.log("")


    });

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */

        // Player has taken all tokens from the pool
        // expect(
        //     await token.balanceOf(player.address)
        // ).to.be.equal(TOKENS_IN_POOL);
        // expect(
        //     await token.balanceOf(pool.address)
        // ).to.be.equal(0);
    });
});

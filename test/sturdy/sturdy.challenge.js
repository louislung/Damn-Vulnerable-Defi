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

        CollateralAdapter = await (await ethers.getContractFactory('CollateralAdapter', deployer)).deploy();
        ConvexCurveLPVault = await (await ethers.getContractFactory('ConvexCurveLPVault', deployer)).deploy();
    });

    it('Execution', async function () {
        const abicoder = new ethers.utils.AbiCoder();




    });

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */

    });
});

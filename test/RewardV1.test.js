const { assert } = require("chai")
const testUtils = require('./utils')

const {
    expectRevert,
    time
} = require('@openzeppelin/test-helpers');
const ethSigUtil = require('eth-sig-util');
const { web3, BN } = require("@openzeppelin/test-helpers/src/setup");
const Wallet = require('ethereumjs-wallet').default;
const {
    toBuffer,
    keccak256,
} = require("ethereumjs-util");

const SleepAvatar = artifacts.require('SleepAvatar')
const Reward = artifacts.require('RewardV1')
const MetaTx = artifacts.require('MetaTx')
const MockGooD = artifacts.require('MockGooD')

const { toWei, fromWei } = web3.utils

const MetaTxName = 'MinimalForwarder';
const MetaTxVersion = '0.0.1';
const EIP712Domain = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
];
const MetaTxTypes = {
    EIP712Domain,
    ForwardRequest: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'gas', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
}

const BLOCKS_PER_DAY = 50 // 24 * 60 * 60 / 3

contract('Reward', ([alice, bob, carol, dev, backend]) => {
    let rewardContract
    let metaTxContract
    before(async () => {
        this.metaTx = await MetaTx.new({ from: dev })
        this.domain = {
            name: MetaTxName,
            version: MetaTxVersion,
            chainId: await web3.eth.getChainId(),
            verifyingContract: this.metaTx.address,
        };
        metaTxContract = new web3.eth.Contract(MetaTx.abi, this.metaTx.address)

        this.avatar = await SleepAvatar.new(this.metaTx.address, { from: dev })
        this.good = await MockGooD.new({ from: dev })

        this.reward = await Reward.new(
            BLOCKS_PER_DAY,
            this.avatar.address,
            this.good.address,
            this.metaTx.address,
            {
                from: dev
            }
        )
        this.reward.transferOwnership(backend, { from: dev })
        rewardContract = new web3.eth.Contract(Reward.abi, this.reward.address)

        await this.good.transfer(this.reward.address, toWei('100000000'), { from: dev })

        // Helper methods
        this.expectPhase = async (expectNumPhase, expectBlockPhase) => {
            let numPhase = await this.reward.avatarNumPhase(await this.avatar.getCurrTokenId())
            let blockPhase = await this.reward.blockPhase(await web3.eth.getBlockNumber())
            assert.equal(numPhase, expectNumPhase)
            assert.equal(blockPhase, expectBlockPhase)

            let phase = numPhase >= blockPhase ? numPhase : blockPhase
            let expectPhase = expectNumPhase >= expectBlockPhase ? expectNumPhase : expectBlockPhase

            assert.equal(phase, expectPhase, 'unexpected phase')
        }

        this.expectFeed = async (tokenId, amount) => {
            let feedReceipt = await this.reward.feed(tokenId, amount, { from: backend })
            const feedEventArgs = testUtils.getEventArgsFromTx(feedReceipt, 'Feeding')
            assert.equal(
                feedEventArgs.tokenId.toString(),
                tokenId.toString(),
                'unexpected feeding tokenId'
            )

            assert.equal(
                feedEventArgs.amount.toString(),
                amount.toString(),
                'unexpected feeding amount'
            )
        }

        this.expectWithdraw = async (tokenId, expectReward, expectAmount, expectSurplus) => {
            assert.equal(await this.reward.reward(tokenId), expectReward)

            let owner = await this.avatar.ownerOf(tokenId)
            let beforeBalance = await this.good.balanceOf(owner)

            let withdrawReceipt = await this.reward.withdraw(tokenId, { from: owner })
            let withdrawalEventArgs = testUtils.getEventArgsFromTx(withdrawReceipt, 'Withdrawal')
            let afterBalance = await this.good.balanceOf(owner)
            assert.equal(
                withdrawalEventArgs.tokenId.toString(),
                tokenId.toString(),
                'tokenId not equal'
            )
            assert.equal(
                withdrawalEventArgs.to,
                owner,
                'unexpected recipient of withdrawal'
            )
            assert.equal(
                withdrawalEventArgs.amount.toString(),
                expectAmount.toString(),
                'unexpected withdrawal amount'
            )

            assert.equal(
                await this.reward.reward(tokenId),
                expectSurplus,
                'unexpected surplus reward'
            )

            assert.equal(
                afterBalance.toString(),
                beforeBalance.add(new BN(expectAmount)),
                'unexpected balance'
            )
        }
    })

    let aliceAvatarId
    let bobAvatarId
    let carolAvatarId
    it('Users create avatar owned by themself', async () => {
        let createAvatarReceipt1 = await this.avatar.createAvatar({ from: alice })
        const transferEventArgs1 = testUtils.getEventArgsFromTx(createAvatarReceipt1, 'Transfer')
        aliceAvatarId = transferEventArgs1.tokenId
        assert.equal(aliceAvatarId.toString(), '1')
        assert.equal(await this.avatar.ownerOf(aliceAvatarId), alice)
        
        let createAvatarReceipt2 = await this.avatar.createAvatar({ from: bob })
        const transferEventArgs2 = testUtils.getEventArgsFromTx(createAvatarReceipt2, 'Transfer')
        bobAvatarId = transferEventArgs2.tokenId
        assert.equal(bobAvatarId.toString(), '2')
        assert.equal(await this.avatar.ownerOf(bobAvatarId), bob)

        let createAvatarReceipt3 = await this.avatar.createAvatar({ from: carol })
        const transferEventArgs3 = testUtils.getEventArgsFromTx(createAvatarReceipt3, 'Transfer')
        carolAvatarId = transferEventArgs3.tokenId
        assert.equal(carolAvatarId.toString(), '3')
        assert.equal(await this.avatar.ownerOf(carolAvatarId), carol)
    })

    it('Backend feeds avatars', async() => {
        await this.expectFeed(aliceAvatarId, '1')
    })

    it('Backend feeds avatar out of max amount', async() => {
        expectRevert(
            this.reward.feed(aliceAvatarId, '7', { from: backend }),
            'RewardV1: out of max amount'
        )
    })

    it('Reward', async() => {
        await this.expectPhase(0, 0)
        assert.equal(await this.reward.currReward(), toWei('6'))
        await this.expectWithdraw(aliceAvatarId, toWei('6'), toWei('6'), '0')

        await this.expectFeed(aliceAvatarId, '6')
        await this.expectWithdraw(aliceAvatarId, toWei('36'), toWei('36'), '0')

        await time.advanceBlockTo('57')
        await this.expectPhase(0, 1)
        assert.equal(await this.reward.currReward(), toWei('5'))
        await this.expectFeed(aliceAvatarId, '7')
        await this.expectWithdraw(aliceAvatarId, toWei('35'), toWei('35'), '0')
        await this.expectFeed(carolAvatarId, '7')
        await this.expectWithdraw(carolAvatarId, toWei('35'), toWei('35'), '0')

        await time.advanceBlockTo('157')
        await this.expectPhase(0, 3)
        assert.equal(await this.reward.currReward(), toWei('3'))
        await this.expectFeed(aliceAvatarId, '7')
        await this.expectWithdraw(aliceAvatarId, toWei('21'), toWei('21'), '0')
        await this.expectFeed(carolAvatarId, '7')
        await this.expectWithdraw(carolAvatarId, toWei('21'), toWei('21'), '0')
    })

    it('Feed avatars without power', async() => {
        await expectRevert(
            this.reward.feed(bobAvatarId, '1', { from: bob }),
            'Ownable: caller is not the owner'
        )
    })

    // It must be the last one case.
    it('Bob delegates backend to feed avatars', async() => {
        let oldBackend = backend
        let wallet = Wallet.generate()
        backend = web3.utils.toChecksumAddress(wallet.getAddressString())
        await this.reward.transferOwnership(backend, { from: oldBackend })
        assert.equal((await this.reward.records(bobAvatarId)).toString(), '0')

        let feedMethod = rewardContract.methods.feed(bobAvatarId, '1')
        let [returndata, receipt] = await mustExecuteMetaTx(wallet, bob, metaTxContract, feedMethod, this.reward.address, '0', this.domain)
        console.log('returndata: ', returndata)
        console.log('receipt: ', receipt)
        assert.equal((await this.reward.records(bobAvatarId)).toString(), '1')
    })

    it('test sign typed data', async() => {
        // TODO: delete
        domain = this.domain
        req = {
            from: '0x11a449ed8eadacda0a290ad0ffee174fdf0b3f7a',
            to: '0x11a449ed8eadacda0a290ad0ffee174fdf0b3f7a',
            value: '0',
            gas: '100000000',
            nonce: Number(1),
            data: '0xdddddd',
        }
        let typedData = getTypedMessage(
            req,
            domain,
        )

        let typedHash = await this.metaTx.digest(req)
        console.log('--------- typedData: ', JSON.stringify(typedData))
        console.log('--------- typedHash: ', typedHash)

        let wallet = Wallet.fromPrivateKey(toBuffer('0x9a01f5c57e377e0239e6036b7b2d700454b760b2dab51390f1eeb2f64fe98b68'))
        let sig = signTypedData(
            wallet,
            typedData,
        )
        console.log('--------- expectSig: ', sig)
        console.log('--------- sig      : ', ethSigUtil.personalSign(wallet.getPrivateKey(), typedHash))
    })
})

const mustExecuteMetaTx = async (wallet, delegatorAddr,metaTxContract, method, to, value, domain) => {
    let fromAddr = web3.utils.toChecksumAddress(wallet.getAddressString())
    let gas = await method.estimateGas({ from: fromAddr })
    let data = method.encodeABI()
    let nonce = await web3.eth.getTransactionCount(fromAddr)

    let req = {
        from: fromAddr,
        to: web3.utils.toChecksumAddress(to),
        value: value,
        gas: gas,
        nonce: Number(nonce),
        data: data,
    }

    let typedData = getTypedMessage(req, domain)
    let signature = signTypedData(wallet, typedData)

    let returnData = await metaTxContract.methods.mustExecute(req, signature).call({ from: delegatorAddr })
    // NOTE: MUST estimateGas
    let fnGas = await metaTxContract.methods.mustExecute(req, signature).estimateGas({ from: delegatorAddr })
    let receipt = await metaTxContract.methods.mustExecute(req, signature).send({ from: delegatorAddr, gas: fnGas })

    return [returnData, receipt]
}

const getTypedMessage = (req, domain) => {
    return {
        types: MetaTxTypes,
        domain: domain,
        primaryType: 'ForwardRequest',
        message: req,
    }
}

const signTypedData = (wallet, typedData) => {
    return ethSigUtil.signTypedMessage(
        wallet.getPrivateKey(),
        {
            data: typedData,
        },
    )
}
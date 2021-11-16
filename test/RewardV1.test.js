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
const Reward = artifacts.require('RewardV1Mock')
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

const BLOCKS_PER_DAY = 4 // 24 * 60 * 60 / 3
const BLOCKS_PER_WEEK = 7 * BLOCKS_PER_DAY

contract('RewardV2', ([alice, bob, carol, dev, backend]) => {
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
        this.expectPhase = async (expectNumPhase, expectBlockPhase, expectPhase) => {
            let numPhase = await this.reward.avatarNumPhase(await this.reward.avatarCount())
            let blockPhase = await this.reward.blockPhase()
            assert.equal(numPhase, expectNumPhase, 'unexpected numPhase')
            assert.equal(blockPhase, expectBlockPhase, 'unexpected blockPhase')

            let phase = await this.reward.phase()

            assert.equal(phase, expectPhase, 'unexpected phase')
        }
        
        this.expectFeed = async (tokenId, amount, isCheckBlockPhaseUpdated, expectPhase) => {
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

            if (isCheckBlockPhaseUpdated) {
                const phaseUpdated = testUtils.getEventArgsFromTx(feedReceipt, 'BlockPhaseUpdated')
                assert.notEqual(phaseUpdated, null, 'no phase update')
                assert.equal(phaseUpdated.phase, expectPhase, 'wrong phase after feeding')
            }
        }

        this.addAvatarNum = async (count) => {
            for (let i = 1; i <= count; i++) {
                let oldAvatarNum = await this.reward.avatarCount()
                let createAvatarReceipt = await this.avatar.createAvatar({ from: dev })
                const transferEventArgs = testUtils.getEventArgsFromTx(createAvatarReceipt, 'Transfer')
                let tokenId = transferEventArgs.tokenId
                await this.expectFeed(tokenId, '1', false)
                let newAvatarNum = await this.reward.avatarCount()
                
                assert.equal(
                    newAvatarNum.toString(),
                    oldAvatarNum.add(new BN(1)).toString(),
                    'unexpected avatar count'
                )
            }
        }

        this.expectWithdraw = async (tokenId, expectReward, expectAmount, expectSurplus) => {
            assert.equal((await this.reward.reward(tokenId)).toString(), expectReward, 'unexpected pending reward')

            let owner = await this.avatar.ownerOf(tokenId)
            let beforeBalance = await this.good.balanceOf(owner)

            let withdrawReceipt = await this.reward.withdraw(
                tokenId,
                await this.reward.reward(tokenId),
                { from: owner }
            )
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

    it('rewardSurplus', async () => {
        assert.equal(await this.reward.rewardSurplus(), toWei('100000000'), 'rewardSurplus incorrect')
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
        await this.expectFeed(aliceAvatarId, toWei('1'), false)
        assert.equal((await this.reward.avatarCount()).toString(), '1')
    })

    it('Withdrawal revert', async() => {
        await expectRevert(
            this.reward.withdraw(carolAvatarId, toWei('1'), { from: dev }),
            'RewardV1: token owner is not you'
        )

        await expectRevert(
            this.reward.withdraw(carolAvatarId, toWei('1'), { from: carol }),
            'RewardV1: pending reward is not enough'
        )

        await expectRevert(
            // amount 7 > pending reward 6
            this.reward.withdraw(aliceAvatarId, toWei('7'), { from: alice }),
            'RewardV1: pending reward is not enough'
        )
    })

    it('Phase', async() => {
        await this.expectPhase(0, 0, 0)
        assert.equal(await this.reward.currReward(), toWei('6'))
        await this.expectWithdraw(aliceAvatarId, toWei('1'), toWei('1'), '0')

        await time.advanceBlockTo('18') // 7 + 11
        await this.expectPhase(0, 0, 0)

        await time.advanceBlockTo('19') // 7 + 12
        await this.expectPhase(0, 1, 1)
        assert.equal(await this.reward.currReward(), toWei('5'))

        await time.advanceBlockTo('35') // 19 + 16
        await this.expectPhase(0, 2, 2)
        assert.equal(await this.reward.currReward(), toWei('4'))
        
        await this.expectFeed(bobAvatarId, toWei('20'), false)
        assert.equal((await this.reward.avatarCount()).toString(), '2')
        await this.expectPhase(1, 2, 2)
        await this.expectWithdraw(bobAvatarId, toWei('20'), toWei('20'), '0')

        await this.avatar.createAvatar({ from: dev })
        await this.expectFeed('4', toWei('20'), false)
        assert.equal((await this.reward.avatarCount()).toString(), '3')
        await this.expectPhase(2, 2, 2)
        await this.expectWithdraw('4', toWei('20'), toWei('20'), '0')

        await this.expectFeed(carolAvatarId, toWei('50'), false)
        assert.equal((await this.reward.avatarCount()).toString(), '4')
        await this.expectPhase(3, 3, 3)
    })
})
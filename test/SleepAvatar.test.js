const { assert } = require("chai")
const testUtils = require('./utils')

const {
    expectRevert,
    time
} = require('@openzeppelin/test-helpers');

const SleepAvatar = artifacts.require('SleepAvatar')
const MetaTx = artifacts.require('MetaTx')

const { toWei, fromWei } = web3.utils

contract('SleepAvatar', ([alice, bob, carol, dev, backend]) => {
    before(async () => {
        this.avatar = await SleepAvatar.new({ from: dev })
        this.avatar.transferOwnership(backend, { from: dev })

        this.metaTx = await MetaTx.new({ from: dev });
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
        let feedReceipt = await this.avatar.feed(aliceAvatarId, toWei('1'), { from: backend })
        const feedEventArgs = testUtils.getEventArgsFromTx(feedReceipt, 'Feeding')
        assert.equal(feedEventArgs.tokenId.toString(), '1')
        assert.equal(feedEventArgs.amount.toString(), toWei('1').toString())
    })

    it('Feed avatars without power', async() => {
        await expectRevert(
            this.avatar.feed(bobAvatarId, toWei('1'), { from: bob }),
            'Ownable: caller is not the owner'
        )
    })

    it('Bob delegates backend to feed avatars', async() => {
        // console.log(this.metaTx.execute)
    })
})
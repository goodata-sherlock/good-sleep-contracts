const { assert } = require("chai")
const testUtils = require('./utils')

const {
    expectRevert,
    time
} = require('@openzeppelin/test-helpers');
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const Wallet = require('ethereumjs-wallet').default;

const SleepAvatar = artifacts.require('SleepAvatar')
const MetaTx = artifacts.require('MetaTx')

const { toWei, fromWei } = web3.utils

contract('SleepAvatar', ([alice, bob, carol, dev, backend]) => {
    before(async () => {
        this.metaTx = await MetaTx.new({ from: dev })
        this.avatar = await SleepAvatar.new(this.metaTx.address, { from: dev })
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

    it('Create an new avatar to a user', async() => {
        let createAvatarReceipt = await this.avatar.createAvatarTo(backend)
        const transferEventArgs = testUtils.getEventArgsFromTx(createAvatarReceipt, 'Transfer')
        let tokenId = transferEventArgs.tokenId
        assert.equal(tokenId.toString(), '4')
        assert.equal(await this.avatar.ownerOf(tokenId), backend)
    })

    it('Token URI', async() => {
        for (let i = 1; i <= 4; i++) {
            let uri = await this.avatar.tokenURI(i)
            assert.equal(uri, 'https://sleep.goodata.io/metadata/data/sleep/' + i)
        }
    })
})
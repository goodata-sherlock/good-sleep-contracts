const { assert } = require("chai")
const testUtils = require('./utils')

const {
    expectRevert,
    time
} = require('@openzeppelin/test-helpers');
const ethSigUtil = require('eth-sig-util');
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const Wallet = require('ethereumjs-wallet').default;

const SleepAvatar = artifacts.require('SleepAvatar')
const MetaTx = artifacts.require('MetaTx')

const { toWei, fromWei } = web3.utils

const name = 'MinimalForwarder';
const version = '0.0.1';
const EIP712Domain = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
];

contract('SleepAvatar', ([alice, bob, carol, dev, backend]) => {
    let avatarContract
    let metaTxContract
    before(async () => {
        this.metaTx = await MetaTx.new({ from: dev })
        this.domain = {
            name,
            version,
            chainId: await web3.eth.getChainId(),
            verifyingContract: this.metaTx.address,
          };
        this.types = {
            EIP712Domain,
            ForwardRequest: [
              { name: 'from', type: 'address' },
              { name: 'to', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'gas', type: 'uint256' },
              { name: 'nonce', type: 'uint256' },
              { name: 'data', type: 'bytes' },
            ],
        };
        metaTxContract = new web3.eth.Contract(MetaTx.abi, this.metaTx.address)

        this.avatar = await SleepAvatar.new(this.metaTx.address, { from: dev })
        this.avatar.transferOwnership(backend, { from: dev })
        avatarContract = new web3.eth.Contract(SleepAvatar.abi, this.avatar.address)
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

    // It must be the last one case.
    it('Bob delegates backend to feed avatars', async() => {
        let oldBackend = backend
        let wallet = Wallet.generate()
        backend = web3.utils.toChecksumAddress(wallet.getAddressString())
        await this.avatar.transferOwnership(backend, { from: oldBackend })
        let feedMethod = avatarContract.methods.feed(bobAvatarId, toWei('1'))
        let [returndata, receipt] = await mustExecuteMetaTx(wallet, bob, metaTxContract, feedMethod, this.avatar.address, '0', this.types, this.domain)
        console.log('returndata: ', returndata)
        console.log('receipt: ', receipt)
        assert.equal((await this.avatar.records(bobAvatarId)).toString(), toWei('1'))
    })
})

const mustExecuteMetaTx = async (wallet, delegatorAddr,metaTxContract, method, to, value, types, domain) => {
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

    let signature = ethSigUtil.signTypedMessage(
        wallet.getPrivateKey(),
        {
            data: {
              types: types,
              domain: domain,
              primaryType: 'ForwardRequest',
              message: req,
            },
        },
    )

    let returnData = await metaTxContract.methods.mustExecute(req, signature).call({ from: delegatorAddr })
    let receipt = await metaTxContract.methods.mustExecute(req, signature).send({ from: delegatorAddr })

    return [returnData, receipt]
}
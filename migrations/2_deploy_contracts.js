const MetaTx = artifacts.require('MetaTx')
const MockGooD = artifacts.require('MockGooD')
const SleepAvatar = artifacts.require('SleepAvatar')
const AppearanceAvatar = artifacts.require('AppearanceAvatar')
const RewardV1 = artifacts.require('RewardV1')

const { toWei, fromWei } = web3.utils

const fs = require('fs')

const BLOCKS_PER_DAY_FOR_TEST = 24 * 60 * 60 / 3 / 3
const BLOCKS_PER_DAY = 24 * 60 * 60 / 3

module.exports = async (deployer, network) => {
    console.log(">>>>> network: ", network)
    await deploy(deployer, network)
}

let deployedContracts = {
    good: '',
    metaTx: '',
    sleepAvatar: '',
    appearanceAvatar: '',
    rewardV1: '',
    startBlock: 0,
}

const deploy = async (deployer, network) => {
    deployedContracts.startBlock = await web3.eth.getBlockNumber()
    if (network.indexOf('testnet') != -1) {
        await deployContractsInTestnet(deployer)
    } else if (network == 'bscmainnet') {
        let goodAddr = '0xdc2e61eb09566135eedfda573f9cc29adbb3d240'
        await deployContractsInMainnet(deployer, goodAddr)
    }

    if (network != 'test' || network != 'development') {
        console.log('deployedContracts: ', deployedContracts)
        
        let obj = JSON.parse(fs.readFileSync('./deployedContracts.json'))
        obj[network] = deployedContracts
        fs.writeFileSync('./deployedContracts.json', JSON.stringify(obj, null, 2))
    }
}

const deployContractsInMainnet = async (deployer, goodAddr) => {
    await deployer.deploy(MetaTx)
    let metaTx = await MetaTx.deployed()
    deployedContracts.metaTx = metaTx.address

    await deployer.deploy(SleepAvatar, metaTx.address)
    let sleepAvatar = await SleepAvatar.deployed()
    deployedContracts.sleepAvatar = sleepAvatar.address

    await deployer.deploy(AppearanceAvatar, metaTx.address)
    let appearanceAvatar = await AppearanceAvatar.deployed()
    deployedContracts.appearanceAvatar = appearanceAvatar.address

    deployedContracts.good = goodAddr

    await deployer.deploy(RewardV1, BLOCKS_PER_DAY, sleepAvatar.address, goodAddr, metaTx.address)
    let rewardV1 = await RewardV1.deployed()
    deployedContracts.rewardV1 = rewardV1.address
}

const deployContractsInTestnet = async (deployer) => {
    await deployer.deploy(MockGooD)
    let good = await MockGooD.deployed()
    deployedContracts.good = good.address

    await deployer.deploy(MetaTx)
    let metaTx = await MetaTx.deployed()
    deployedContracts.metaTx = metaTx.address

    await deployer.deploy(SleepAvatar, metaTx.address)
    let sleepAvatar = await SleepAvatar.deployed()
    deployedContracts.sleepAvatar = sleepAvatar.address

    await deployer.deploy(AppearanceAvatar, metaTx.address)
    let appearanceAvatar = await AppearanceAvatar.deployed()
    deployedContracts.appearanceAvatar = appearanceAvatar.address

    await deployer.deploy(RewardV1, BLOCKS_PER_DAY_FOR_TEST, sleepAvatar.address, good.address, metaTx.address)
    let rewardV1 = await RewardV1.deployed()
    deployedContracts.rewardV1 = rewardV1.address

    // Lock enough token to Reward contract
    await good.transfer(rewardV1.address, toWei('100000000'))

    // Add some test datas
    for (let i = 1; i < 5; i++) {
        await sleepAvatar.createAvatar()
        rewardV1.feed(''+i, ''+i)
    }

    for (let i = 1; i< 4; i++) {
        await appearanceAvatar.createAvatar()
    }

    await rewardV1.withdraw('2')
}

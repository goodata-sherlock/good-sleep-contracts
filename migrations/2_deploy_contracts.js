const MetaTx = artifacts.require('MetaTx')
const MockGooD = artifacts.require('MockGooD')
const SleepAvatar = artifacts.require('SleepAvatar')
const AppearanceAvatar = artifacts.require('AppearanceAvatar')
const RewardV1 = artifacts.require('RewardV1')

const { toWei, fromWei } = web3.utils

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
}

const deploy = async (deployer, network) => {
    if (network.indexOf('testnet') != -1) {
        await deployContractsInTestnet(deployer)
    }

    console.log('deployedContracts: ', deployedContracts)
}

const deployContractsInTestnet = async (deployer) => {
    await deployer.deploy(MetaTx)
    let metaTx = await MetaTx.deployed()
    deployedContracts.metaTx = metaTx.address

    await deployer.deploy(SleepAvatar, metaTx.address)
    let sleepAvatar = await SleepAvatar.deployed()
    deployedContracts.sleepAvatar = sleepAvatar.address

    await deployer.deploy(AppearanceAvatar, metaTx.address)
    let appearanceAvatar = await AppearanceAvatar.deployed()
    deployedContracts.appearanceAvatar = appearanceAvatar.address

    await deployer.deploy(MockGooD)
    let good = await MockGooD.deployed()
    deployedContracts.good = good.address

    await deployer.deploy(RewardV1, sleepAvatar.address, good.address, metaTx.address)
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

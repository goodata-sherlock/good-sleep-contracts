const SleepAvatar = artifacts.require('SleepAvatar')
const AppearanceAvatar = artifacts.require('AppearanceAvatar')

module.exports = async (deployer, network) => {
    console.log(">>>>> network: ", network)
    // await deploy(deployer, network)
}

// const deploy = async (deployer, network) => {
//     if (network.contains('testnet')) {
//         await deployContractsInTestnet(deployer)
//     }
// }

// const deployContractsInTestnet = async (deployer) => {
//     let sleepAvatar = await deployer.deploy(SleepAvatar)
//     let appearanceAvatar = await deployer.deploy(AppearanceAvatar)
//     await sleepAvatar.createAvatar()
// }

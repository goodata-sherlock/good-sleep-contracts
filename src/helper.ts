import {
    Address
} from '@graphprotocol/graph-ts'

const SleepAvatarNFT = '0x2338B7e8189bE74896cD892411A6AFfcDEfC7fa9'
const AppearanceAvatarNFT = '0xbCCab9aDf117C22fee8c0805890bB23f2407316D'

let NFTWhiteList: Array<string> = [
    SleepAvatarNFT,
    AppearanceAvatarNFT,
]

const isInNFTWhiteList = (addr: Address) :boolean => {
    for (let i = 0; i < NFTWhiteList.length; i++) {
        if (Address.fromHexString(NFTWhiteList[i]).equals(addr)) {
            return true
        }
    }

    return false
}

export { SleepAvatarNFT, AppearanceAvatarNFT, NFTWhiteList, isInNFTWhiteList }
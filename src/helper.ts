import {
    Address,
    BigInt
} from '@graphprotocol/graph-ts'

const SleepAvatarNFT = '0xbD12fa08658D878D6Da19600b89c2C69a8cC5F4B'
const AppearanceAvatarNFT = '0x5e5a9D551c2696DE52a4C92683C5c8018347049b'

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

const genTokenID = (addr: Address, tokenId: BigInt) :string => {
    return addr.toHex() + '-' + tokenId.toHex()
}

export { SleepAvatarNFT, AppearanceAvatarNFT, NFTWhiteList, isInNFTWhiteList, genTokenID }

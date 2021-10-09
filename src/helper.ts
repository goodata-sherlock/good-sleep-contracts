import {
    Address,
    BigInt
} from '@graphprotocol/graph-ts'

const SleepAvatarNFT = '0x8e3912653f1137EBaA74402C51BdAF9756d9f86b'
const AppearanceAvatarNFT = '0x5CD4beA5d0C71c8419C43bf6dFBB9c50387D77cc'

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
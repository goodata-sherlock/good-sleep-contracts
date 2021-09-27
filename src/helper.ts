import {
    Address,
    BigInt
} from '@graphprotocol/graph-ts'

const SleepAvatarNFT = '0x6359Ee5b6000169a091b7eb243d5e219c0Ffc7BF'
const AppearanceAvatarNFT = '0xe3a855b650Be77697c1d987f1FB547a7d7167A03'

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
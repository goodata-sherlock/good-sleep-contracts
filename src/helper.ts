import {
    Address,
    BigInt
} from '@graphprotocol/graph-ts'

const SleepAvatarNFT = '0x5cF9F740eB944900e5f73591d62de9722d521f49'
const AppearanceAvatarNFT = '0xCe897c666c3381bB280aA539d1c0A52647697b12'

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

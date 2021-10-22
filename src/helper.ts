import {
    Address,
    BigInt
} from '@graphprotocol/graph-ts'

const SleepAvatarNFT = '0x9479E9f5E9aE366D22751b4F3ED95D28536D2706'
const AppearanceAvatarNFT = '0xa0cdaC91eA6239Adaaa495fF6c6B78E878688EE2'

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

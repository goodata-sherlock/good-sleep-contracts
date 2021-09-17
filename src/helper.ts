import {
    Address
} from '@graphprotocol/graph-ts'

const DataNFT = ''
const AvatarNFT = ''

let NFTWhiteList = [
    DataNFT,
    AvatarNFT,
]

const isInNFTWhiteList = (addr: Address) :boolean => {
    NFTWhiteList.forEach((value) => {
        if (value == addr.toHex()) {
            return true
        }
    })

    return false
}

export { DataNFT, AvatarNFT, NFTWhiteList, isInNFTWhiteList }
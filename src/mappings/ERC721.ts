import {
    Address
} from '@graphprotocol/graph-ts'

import {
    isInNFTWhiteList,
    genTokenID
} from '../helper'

import {
    Approval as ApprovalEvent,
    ApprovalForAll as ApprovalForAllEvent,
    Transfer as TransferEvent,
    TokenURIUpdated as TokenURIUpdatedEvent,
    ERC721
} from '../../generated/GoodSleepContract/ERC721'

import {
    Approval,
    ApprovalForAll,
    Transfer,
    Token,
    TokenCollection,
    TokenURIUpdated
} from "../../generated/schema"

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function handleTransfer(event: TransferEvent): void {
    if (!isInNFTWhiteList(event.address)) {
        return
    }
    let tokenId = event.params.tokenId
    let token: Token
    if (event.params.to.equals(Address.fromHexString(ZERO_ADDRESS))) {
        // burn
        token = Token.load(genTokenID(event.address, tokenId)) as Token
        token.isBurn = true
    } else if (event.params.from.equals(Address.fromHexString(ZERO_ADDRESS))) {
        // mint
        token = new Token(genTokenID(event.address, tokenId))
        token.isBurn = false

        // update collection
        if (TokenCollection.load(event.address.toHex()) == null) {
            let collection = new TokenCollection(
                event.address.toHex()
            )
            let tokenContract = ERC721.bind(event.address)
            collection.name = tokenContract.name()
            collection.symbol = tokenContract.symbol()
            collection.save()
        }
    }

    token.tokenId = event.params.tokenId
    token.owner = event.params.to
    token.collection = event.address.toHex()
    token.save()

    let transfer = new Transfer(
        event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    transfer.from = event.params.from
    transfer.to = event.params.to
    transfer.token = genTokenID(event.address, event.params.tokenId)
    transfer.save()
}

export function handleTokenURIUpdated(event: TokenURIUpdatedEvent): void {
    if (!isInNFTWhiteList(event.address)) {
        return
    }
    let entity = new TokenURIUpdated(
        event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    let tokenContract = ERC721.bind(event.address)
    let uri = tokenContract.tokenURI(event.params.tokenId)
    entity.token = genTokenID(event.address, event.params.tokenId)
    entity.uri = uri
    entity.save()

    let token = Token.load(genTokenID(event.address, event.params.tokenId))
    token.uri = uri
    token.save()
}

export function handleApproval(event: ApprovalEvent): void {
    if (!isInNFTWhiteList(event.address)) {
        return
    }
    let entity = new Approval(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    entity.owner = event.params.owner
    entity.approved = event.params.approved
    entity.token = genTokenID(event.address, event.params.tokenId)
    entity.save()
}
  
export function handleApprovalForAll(event: ApprovalForAllEvent): void {
    if (!isInNFTWhiteList(event.address)) {
        return
    }
    let entity = new ApprovalForAll(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    entity.owner = event.params.owner
    entity.operator = event.params.operator
    entity.approved = event.params.approved
    entity.save()
}
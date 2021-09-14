import { Transfer } from '../generated/GoodSleepContract/ERC721'

import { Token } from '../generated/schema'

export function handleTransfer(event: Transfer): void {
    let tokenId = event.params.tokenId.toHex()
    let token = new Token(tokenId)
    token.currentOwner = event.params.to

    token.save()
}
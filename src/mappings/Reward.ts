import {
    Feeding as FeedingEvent,
    MultiplierUpdated as MultiplierUpdatedEvent,
    Withdrawal as WithdrawalEvent
} from '../../generated/RewardV1/Reward'

import {
    FeedRecord,
    MultiplierUpdated,
    RewardWithdrawal
} from '../../generated/schema'

export function handleFeeding(event: FeedingEvent): void {
    let feedRecord = new FeedRecord(
        event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )

    feedRecord.tokenId = event.params.tokenId
    feedRecord.amount = event.params.amount
    feedRecord.save()
}

export function handleMultiplierUpdated(event: MultiplierUpdatedEvent): void {
    let entity = new MultiplierUpdated(
        event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )

    entity.oldMultiplier = event.params.oldMultiplier
    entity.newMultiplier = event.params.newMultiplier
    entity.save()
}

export function handleWithdrawal(event: WithdrawalEvent): void {
    let entity = new RewardWithdrawal(
        event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )

    entity.tokenId = event.params.tokenId
    entity.to = event.params.to
    entity.amount = event.params.amount
    entity.time = event.block.timestamp
    entity.save()
}
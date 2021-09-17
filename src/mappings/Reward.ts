import {
    BigInt
} from '@graphprotocol/graph-ts'

import {
    Feeding as FeedingEvent,
    MultiplierUpdated as MultiplierUpdatedEvent,
    Withdrawal as WithdrawalEvent
} from '../../generated/RewardV1/Reward'

import {
    RewardRecord,
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
    feedRecord.rewardRecord = event.params.tokenId.toHex()
    feedRecord.save()

    if (RewardRecord.load(feedRecord.rewardRecord) == null) {
        let rewardRecord = new RewardRecord(
            event.params.tokenId.toHex()
        )
        rewardRecord.totalWithdrawal = BigInt.fromI32(0)
        rewardRecord.save()
    }
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
    entity.rewardRecord = event.params.tokenId.toHex()
    entity.save()

    let rewardRecord = new RewardRecord(
        event.params.tokenId.toHex()
    )

    rewardRecord.totalWithdrawal = rewardRecord.totalWithdrawal.plus(event.params.amount)
    rewardRecord.save()
}
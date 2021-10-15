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

    feedRecord.block = event.block.number
    feedRecord.tx = event.transaction.hash
    feedRecord.time = event.block.timestamp

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

    entity.block = event.block.number
    entity.tx = event.transaction.hash
    entity.time = event.block.timestamp

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

    entity.block = event.block.number
    entity.tx = event.transaction.hash
    entity.time = event.block.timestamp

    entity.save()

    let rewardRecord = RewardRecord.load(event.params.tokenId.toHex()) as RewardRecord

    rewardRecord.totalWithdrawal = rewardRecord.totalWithdrawal.plus(event.params.amount)

    rewardRecord.save()
}
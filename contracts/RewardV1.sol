// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "./Reward.sol";

contract RewardV1 is Reward {
    constructor(address trustedForwarder) Reward(trustedForwarder) {}
}
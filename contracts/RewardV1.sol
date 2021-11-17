// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RewardV1Template.sol";

contract RewardV1 is RewardV1Template {
    using SafeMath for uint256;

    uint256 public initialRewardPerAmount = 20 * 10**18;
    uint256 public constant BLOCKS_PER_DAY = 24 * 60 * 60 / 3;
    uint256 public constant BLOCKS_PER_WEEK = 7 * BLOCKS_PER_DAY;
    uint256 public constant BLOCKS_PER_MONTH = 30 * BLOCKS_PER_DAY;

    constructor(address _avatar, address _good, address trustedForwarder)
        RewardV1Template(_avatar, _good, trustedForwarder) {
    }

    function maxPhase() public override pure returns(uint256) {
        return 8;
    }

    function avatarNumPhase(uint256 avatarNum) public override pure returns(uint256) {
        if (avatarNum <= 1000) { // 1k
            return 0;
        } else if (avatarNum <= 5000) { // 5k
            return 1;
        } else if (avatarNum <= 15000) { // 15k
            return 2;
        } else if (avatarNum <= 30000) { // 30k
            return 3;
        } else if (avatarNum <= 50000) { // 50k
            return 4;
        } else if (avatarNum <= 100000) { // 100k
            return 5;
        } else if (avatarNum <= 200000) { // 200k
            return 6;
        } else if (avatarNum <= 350000) { // 350k
            return 7;
        } else { // 500k
            return maxPhase(); // 8
        }
    }

    function blocksOfCurrPhase() public override view returns(uint256) {
        return blocksGivenPhase(lastBlockPhase);
    }

    function blocksGivenPhase(uint256 _phase) public override pure returns(uint256) {
        if (_phase == 0) {
            return  BLOCKS_PER_DAY;
        } else if (_phase == 1) {
            return BLOCKS_PER_WEEK;
        } else if (_phase == 2) {
            return BLOCKS_PER_WEEK.mul(2);
        } else if (_phase == 3) {
            return BLOCKS_PER_WEEK.mul(3);
        } else if (_phase == 4) {
            return BLOCKS_PER_WEEK.mul(4);
        } else if (_phase == 5) {
            return BLOCKS_PER_MONTH.mul(2);
        } else if (_phase == 6) {
            return BLOCKS_PER_MONTH.mul(3);
        } else {
            return BLOCKS_PER_MONTH.mul(4);
        }
    }

    function _currReward(uint256 _currPhase) public override view returns(uint256) {
        uint256 _base = 1*10**18;
        if (_currPhase == 0) {
            return initialRewardPerAmount;
        } else if (_currPhase == 1) {
            return _base.mul(16);
        } else if (_currPhase == 2) {
            return _base.mul(12);
        } else if (_currPhase == 3) {
            return _base.mul(8);
        } else if (_currPhase == 4) {
            return _base.mul(4);
        } else if (_currPhase == 5) {
            return _base.mul(3);
        } else {
            return _base.mul(2);
        }
    }

    function estimateReward(uint256 tokenId, uint256 amount) public override view returns(uint256) {
        uint256 _oldReward = pendingReward[tokenId];
        // 1 record equals 1 reward.
        return _oldReward.add(amount);
    }
}
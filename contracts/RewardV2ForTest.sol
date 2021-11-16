// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RewardV1Template.sol";

contract RewardV2ForTest is RewardV1Template {
    using SafeMath for uint256;

    uint256 public initialRewardPerAmount = 6 * 10**18;
    uint256 public constant BLOCKS_PER_DAY = 4;
    uint256 public constant BLOCKS_PER_WEEK = 7 * BLOCKS_PER_DAY;
    uint256 public constant BLOCKS_PER_MONTH = 30 * BLOCKS_PER_DAY;

    constructor(address _avatar, address _good, address trustedForwarder)
        RewardV1Template(_avatar, _good, trustedForwarder) {
    }

    function maxPhase() public override pure returns(uint256) {
        return 4;
    }

    function avatarNumPhase(uint256 avatarNum) public override pure returns(uint256) {
        if (avatarNum <= 1) { // 1
            return 0;
        } else if (avatarNum <= 2) { // 2
            return 1;
        } else if (avatarNum <= 3) { // 3
            return 2;
        } else if (avatarNum <= 4) { // 4
            return 3;
        } else { // 5
            return maxPhase(); // 4
        }
    }

    function blocksOfCurrPhase() public override view returns(uint256) {
        return blocksGivenPhase(lastBlockPhase);
    }

    function blocksGivenPhase(uint256 _phase) public override pure returns(uint256) {
        if (_phase == 0) {
            return  BLOCKS_PER_DAY.mul(3);
        } else if (_phase == 1) {
            return BLOCKS_PER_DAY.mul(4);
        } else if (_phase == 2) {
            return BLOCKS_PER_DAY.mul(5);
        } else if (_phase == 3) {
            return BLOCKS_PER_WEEK;
        } else {
            return BLOCKS_PER_WEEK.mul(2);
        }
    }

    function _currReward(uint256 _currPhase) public override view returns(uint256) {
        uint256 _base = 1*10**18;
        if (_currPhase == 0) {
            return initialRewardPerAmount;
        } else if (_currPhase == 1) {
            return _base.mul(5);
        } else if (_currPhase == 2) {
            return _base.mul(4);
        } else if (_currPhase == 3) {
            return _base.mul(2);
        } else {
            return _base.mul(1);
        }
    }

    function _estimateReward(uint256 tokenId, uint256 amount) internal virtual override view returns(uint256) {
        uint256 _oldReward = pendingReward[tokenId];
        // 1 record equals 1 reward.
        return _oldReward.add(amount);
    }
}
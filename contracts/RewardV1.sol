// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RewardV1Template.sol";

contract RewardV1 is RewardV1Template {
    using SafeMath for uint256;

    uint256 public initialRewardPerAmount = 6 * 10**18;

    constructor(uint256 _blocks_per_day, address _avatar, address _good, address trustedForwarder)
        RewardV1Template(_blocks_per_day, _avatar, _good, trustedForwarder) {
    }

    function maxPhse() public override pure returns(uint256) {
        return 7;
    }

    function avatarNumPhase(uint256 avatarNum) public override pure returns(uint256) {
        if (avatarNum <= 5000) {
            return 0;
        } else if (avatarNum <= 15000) {
            return 1;
        } else if (avatarNum <= 30000) {
            return 2;
        } else if (avatarNum <= 50000) {
            return 3;
        } else if (avatarNum <= 100000) {
            return 4;
        } else if (avatarNum <= 200000) {
            return 5;
        } else if (avatarNum <= 350000) {
            return 6;
        } else { // <= 500000
            return maxPhse(); // 7
        }
    }

    function _currReward(uint256 _currPhase) public override view returns(uint256) {
        uint256 _base = 1*10**18;
        if (_currPhase < 4) {
            return initialRewardPerAmount.sub(_base.mul(_currPhase));
        } else if (_currPhase < 6) {
            return 2*10**18; // 2
        } else {
            return 15*10**17; // 1.5
        }
    }

    function blocksPerPhase() public override view returns(uint256) {
        return BLOCKS_PER_WEEK;
    }
}
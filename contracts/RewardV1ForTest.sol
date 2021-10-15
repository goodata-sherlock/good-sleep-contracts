// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RewardV1Template.sol";

contract RewardV1ForTest is RewardV1Template {
    using SafeMath for uint256;

    uint256 public initialRewardPerAmount = 6 * 10**18;

    constructor(address _avatar, address _good, address trustedForwarder)
        RewardV1Template(_avatar, _good, trustedForwarder) {
    }

    function maxPhse() public override pure returns(uint256) {
        return 7;
    }

    function blocksPerPhase() public override pure returns(uint256) {
        return 28;
    }

    function avatarNumPhase(uint256 avatarNum) public override pure returns(uint256) {
        if (avatarNum <= 3) {
            return 0;
        } else if (avatarNum <= 4) {
            return 1;
        } else if (avatarNum <= 5) {
            return 2;
        } else if (avatarNum <= 6) {
            return 3;
        } else if (avatarNum <= 7) {
            return 4;
        } else if (avatarNum <= 8) {
            return 5;
        } else if (avatarNum <= 9) {
            return 6;
        } else { // <= 10
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
}
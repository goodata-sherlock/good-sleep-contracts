// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Reward.sol";
import "./Avatar.sol";

contract RewardV1 is Reward {
    using SafeMath for uint256;

    struct AvatarReward {
        uint256 joinPhase;
        uint256 joinTime;
        uint256 lastRewardTime;
    }

    Avatar avatar;
    mapping (uint256 => AvatarReward) avatarRewards;
    uint256 startTime;
    uint256 initialRewardPerDay = 6 * 10**18;

    constructor(address _avatar, address trustedForwarder) Reward(trustedForwarder) {
        avatar = Avatar(_avatar);
        startTime = block.timestamp;
    }

    function _beforeFeed(uint256 tokenId, uint256 amount) internal virtual override {
        bool isExistentAvatar = false;
        try avatar.ownerOf(tokenId) returns(address _owner) {
            isExistentAvatar = _owner != address(0);
        } catch Error(string memory /*reason*/) {
        } catch (bytes memory /*lowLevelData*/) {
        }
        require(isExistentAvatar, "Reward: Feed nonexistent avatar");
        require(amount != 0, "Reward: Feed zero amount");
    }

    function _afterFeed(uint256 tokenId, uint256 amount) internal virtual override {
        avatarRewards[tokenId] = AvatarReward({
            joinPhase: _phase(),
            joinTime: block.timestamp,
            lastRewardTime: block.timestamp
        });
    }

    function _phase() public virtual override view returns(uint256) {
        return _phase(avatar.getCurrTokenId(), block.timestamp);
    }

    function _phase(uint256 avatarNum, uint256 time) internal view returns(uint256) {
        uint256 _numPhase = avatarNumPhase(avatarNum);
        uint256 _timePhase = timePhase(time);
        return _numPhase > _timePhase ? _numPhase : _timePhase;
    }

    function avatarNumPhase(uint256 avatarNum) public pure returns(uint256) {
        if (avatarNum <= 5000) {
            return 0;
        } else if (avatarNum <= 15000) {
            return 1;
        } else if (avatarNum <= 30000) {
            return 2;
        } else {
            return 3;
        }
    }

    function timePhase(uint256 currTime) public view returns(uint256) {
        require(currTime >= startTime, "RewardV1: currTime less than startTime");
        uint256 duration = currTime.sub(startTime);
        return duration.div(1 weeks);
    }

    function currReward() public view returns(uint256) {
        return _currReward(_phase());
    }

    function _currReward(uint256 _currPhase) public view returns(uint256) {
        uint256 _base = 1*10**18;
        return initialRewardPerDay.sub(_base.mul(_currPhase));
    }

    function _reward(uint256 tokenId) public virtual override view returns(uint256) {
        uint256 accumulatedReward;
        AvatarReward memory _avatarReward = avatarRewards[tokenId];
        uint256 _phaseTime = phaseTime();
        uint256 _endTime = block.timestamp;
        uint256 _avatarNum = avatar.getCurrTokenId();
        for (uint256 i = _avatarReward.lastRewardTime; i < _endTime; i = i.add(_phaseTime)) {
            uint256 _phaseEndTime = i.add(_phaseTime);
            if (_phaseEndTime > _endTime) {
                _phaseEndTime = _endTime;
            }
            uint256 duration = _phaseEndTime.sub(i);
            uint256 _phaseReward = _currReward(_phase(_avatarNum, i)).mul(duration.div(1 days));
            accumulatedReward.add(_phaseReward);
        }
        return accumulatedReward;
    }

    function phaseTime() public virtual pure returns(uint256) {
        return 1 weeks;
    }

    function endTime() public virtual view returns(uint256) {
        return startTime.add(4 weeks);
    }

    function _withdraw(uint256 tokenId) public virtual override returns(uint256) {
        uint256 pendingReward = _reward(tokenId);
        return pendingReward;
    }
}
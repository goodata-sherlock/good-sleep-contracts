// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Reward.sol";
import "./Avatar.sol";

contract RewardV1 is Reward {
    using SafeMath for uint256;

    Avatar avatar;
    ERC20 good;
    mapping(uint256 => uint256) pendingReward;
    uint256 startTime;
    uint256 initialRewardPerDay = 6 * 10**18;

    constructor(address _avatar, address _good, address trustedForwarder) Reward(trustedForwarder) {
        avatar = Avatar(_avatar);
        startTime = block.timestamp;
        good = ERC20(_good);
    }

    function _beforeFeed(uint256 tokenId, uint256 amount) internal virtual override {
        require(endTime() >= block.timestamp, "RewardV1: out of endTime");
        bool isExistentAvatar = false;
        try avatar.ownerOf(tokenId) returns(address _owner) {
            isExistentAvatar = _owner != address(0);
        } catch Error(string memory /*reason*/) {
        } catch (bytes memory /*lowLevelData*/) {
        }
        require(isExistentAvatar, "RewardV1: feed nonexistent avatar");
        require(amount != 0, "RewardV1: feed zero amount");
    }

    function _afterFeed(uint256 tokenId, uint256 amount) internal virtual override {
        uint256 _oldReward = pendingReward[tokenId];
        pendingReward[tokenId] = _oldReward.add(amount.mul(currReward()));
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
        return duration > 4 weeks? 3 : duration.div(1 weeks);
    }

    function currReward() public view returns(uint256) {
        return _currReward(_phase());
    }

    function _currReward(uint256 _currPhase) public view returns(uint256) {
        uint256 _base = 1*10**18;
        return initialRewardPerDay.sub(_base.mul(_currPhase));
    }

    function _reward(uint256 tokenId) public virtual override view returns(uint256) {
        return pendingReward[tokenId];
    }

    function phaseTime() public virtual pure returns(uint256) {
        return 1 weeks;
    }

    function endTime() public virtual view returns(uint256) {
        return startTime.add(4 weeks);
    }

    function _withdraw(uint256 tokenId) public virtual override returns(uint256) {
        uint256 amount = _reward(tokenId);
        good.transfer(avatar.ownerOf(tokenId), amount);
        lastRewardRecords[tokenId] = records[tokenId];
        return amount;
    }
}
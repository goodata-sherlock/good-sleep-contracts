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
    uint256 public startBlock;
    uint256 public initialRewardPerDay = 6 * 10**18;
    uint256 public BLOCKS_PER_DAY;
    uint256 public BLOCKS_PER_WEEK;

    constructor(uint256 _blocks_per_day, address _avatar, address _good, address trustedForwarder) Reward(trustedForwarder) {
        BLOCKS_PER_DAY = _blocks_per_day;
        BLOCKS_PER_WEEK = 7 * BLOCKS_PER_DAY;
        avatar = Avatar(_avatar);
        startBlock = block.number;
        good = ERC20(_good);
    }

    function _beforeFeed(uint256 tokenId, uint256 amount) internal virtual override {
        require(endBlock() >= block.number, "RewardV1: out of end block");
        // amount validation migrates to backend. There is no amount validation.
        // require(records[tokenId].add(amount) <= maxAmount(), "RewardV1: out of max amount");
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
        pendingReward[tokenId] = _estimateReward(tokenId, amount);
    }

    function _phase() internal virtual override view returns(uint256) {
        return _phase(avatar.getCurrTokenId(), block.number);
    }

    function _phase(uint256 avatarNum, uint256 currBlock) internal view returns(uint256) {
        uint256 _numPhase = avatarNumPhase(avatarNum);
        uint256 _blockPhase = blockPhase(currBlock);
        return _numPhase > _blockPhase ? _numPhase : _blockPhase;
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

    function blockPhase(uint256 currBlock) public view returns(uint256) {
        require(currBlock >= startBlock, "RewardV1: curr block less than start block");
        uint256 duration = currBlock.sub(startBlock);
        return duration > 4 * BLOCKS_PER_WEEK ? 3 : duration.div(1 * BLOCKS_PER_DAY);
    }

    function currReward() public view returns(uint256) {
        return _currReward(_phase());
    }

    function _currReward(uint256 _currPhase) public view returns(uint256) {
        uint256 _base = 1*10**18;
        return initialRewardPerDay.sub(_base.mul(_currPhase));
    }

    function _reward(uint256 tokenId) internal virtual override view returns(uint256) {
        return pendingReward[tokenId];
    }

    function _estimateReward(uint256 tokenId, uint256 amount) internal virtual override view returns(uint256) {
        uint256 _oldReward = pendingReward[tokenId];
        return _oldReward.add(amount.mul(currReward()).mul(multiplier).div(10**18));
    }

    // function maxAmount() public view returns(uint256) {
    //     return _phase().add(1).mul(7);
    // }

    function phaseTime() public virtual pure returns(uint256) {
        return 1 weeks;
    }

    function endBlock() public virtual view returns(uint256) {
        return startBlock.add(4 * BLOCKS_PER_WEEK);
    }

    function _withdraw(uint256 tokenId) internal virtual override returns(address, uint256) {
        uint256 amount = _reward(tokenId);
        require(amount > 0, "RewardV1: pending reward is zero");
        address tokenOwner = avatar.ownerOf(tokenId);
        require(tokenOwner == _msgSender(), "RewardV1: token owner is not you");
        pendingReward[tokenId] = pendingReward[tokenId].sub(amount);
        good.transfer(tokenOwner, amount);
        lastRewardRecords[tokenId] = records[tokenId];
        return (tokenOwner, amount);
    }
}
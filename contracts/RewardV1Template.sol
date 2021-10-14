// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Reward.sol";
import "./Avatar.sol";

contract RewardV1Template is Reward {
    using SafeMath for uint256;

    event BlockPhaseUpdated(uint256 lastBlock, uint256 phase);

    Avatar avatar;
    uint256 public avatarCount;
    ERC20 good;
    mapping(uint256 => uint256) pendingReward;
    mapping(uint256 => bool) isAvatarExist;
    uint256 public startBlock;

    //////////////////////////////////////////////////////////
    // updated when                                         //
    // avatarNumPhase > blockPhase                          //
    // or                                                   //
    // (currBlock - lastBlock) / BLOCKS_PER_PHASE >= 1      //
    uint256 public lastBlock;                               //
    uint256 public lastBlockPhase;                          //
    //////////////////////////////////////////////////////////

    constructor(address _avatar, address _good, address trustedForwarder) Reward(trustedForwarder) {
        avatar = Avatar(_avatar);
        startBlock = block.number;
        lastBlock = startBlock;
        good = ERC20(_good);
    }

    function _beforeFeed(uint256 tokenId, uint256 amount) internal virtual override {
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
        if (isAvatarExist[tokenId] == false) {
            isAvatarExist[tokenId] = true;
            avatarCount = avatarCount.add(1);
        }
        updatePhase();
        pendingReward[tokenId] = _estimateReward(tokenId, amount);
    }

    function updatePhase() public {
        updateBlockPhase();
        uint256 _numPhase = avatarNumPhase(avatarCount);
        uint256 _blockPhase = blockPhase();
        if (_numPhase > _blockPhase) {
            lastBlock = block.number;
            lastBlockPhase = _numPhase;
            emit BlockPhaseUpdated(block.number, lastBlockPhase);
        }
    }

    function updateBlockPhase() internal {
        uint256 phaseNum = increasedBlockPhaseNum();
        if (phaseNum >= 1) {
            lastBlockPhase = lastBlockPhase.add(phaseNum);
            lastBlock = lastBlock.add(phaseNum * blocksPerPhase()); // rather than lastBlock = block.number
            emit BlockPhaseUpdated(lastBlock, lastBlockPhase);
        }
    }

    /** 
    * @dev Increase phase when the number of avatar exceeds range or
    *      time exceeds 1 week in that phase
    */
    function _phase() internal virtual override view returns(uint256) {
        return _phase(avatarCount);
    }

    function _phase(uint256 avatarNum) internal view returns(uint256) {
        uint256 _numPhase = avatarNumPhase(avatarNum);
        uint256 _blockPhase = blockPhase();
        return _numPhase > _blockPhase ? _numPhase : _blockPhase;
    }

    /**
    * @dev need to implement in child contract.
     */
    function maxPhse() public virtual pure returns(uint256) {
        return 7;
    }

    /**
    * @dev need to implement in child contract.
     */
    function avatarNumPhase(uint256 avatarNum) public virtual pure returns(uint256) {
        return 0;
    }

    function increasedBlockPhaseNum() public view returns(uint256) {
        uint256 phaseNum = (block.number.sub(lastBlock)).div(blocksPerPhase());
        phaseNum = phaseNum.add(lastBlockPhase) <= maxPhse()? phaseNum: 0;
        return phaseNum;
    }

    function blockPhase() public view returns(uint256) {
        return lastBlockPhase.add(increasedBlockPhaseNum());
    }

    /**
    * @dev need to implement in child contract.
     */
    function blocksPerPhase() public virtual pure returns(uint256) {
        return 10000;
    }

    function currReward() public view returns(uint256) {
        return _currReward(_phase());
    }

    /**
    * @dev need to implement in child contract.
     */
    function _currReward(uint256 _currPhase) public virtual view returns(uint256) {
        return 1*10**18;
    }

    function _reward(uint256 tokenId) internal virtual override view returns(uint256) {
        return pendingReward[tokenId];
    }

    function _rewardSurplus() public virtual override view returns(uint256) {
        return good.balanceOf(address(this));
    }

    function _estimateReward(uint256 tokenId, uint256 amount) internal virtual override view returns(uint256) {
        uint256 _oldReward = pendingReward[tokenId];
        return _oldReward.add(amount.mul(currReward()).mul(multiplier).div(10**18));
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
// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "./IReward.sol";

// MUST inherit ERC2771Context for supporting meta tx.
abstract contract Reward is IReward, Ownable, ERC2771Context {
    using Strings for uint256;
    using SafeMath for uint256;

    // tokenId => the number of records
    mapping (uint256 => uint256) public override records;
    mapping (uint256 => uint256) public override lastRewardRecords;
    uint256 public override multiplier = 10**18;

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    function feed(uint256 tokenId, uint256 amount) public virtual onlyOwner override {
        _beforeFeed(tokenId, amount);
        
        uint256 _record = records[tokenId];
        records[tokenId] = _record.add(amount);
        emit Feeding(tokenId, amount);
        _afterFeed(tokenId, amount);
    }

    /**
    * @dev Hook that is called before any feed.
    */
    function _beforeFeed(uint256 tokenId, uint256 amount) internal virtual {}

    /**
    * @dev Hook that is called after any feed.
    */
    function _afterFeed(uint256 tokenId, uint256 amount) internal virtual {}

    function batchFeed(FeedParam[] memory params) public virtual onlyOwner override {
        for (uint256 i = 0; i < params.length; i++) {
            FeedParam memory param = params[i];
            feed(param.tokenId, param.amount);
        }
    }

    function phase() public override view returns(uint256) {
        return _phase();
    }

    function _phase() internal virtual view returns(uint256) {
        return 0;
    }

    function reward(uint256 tokenId) public view override returns(uint256) {
        return _reward(tokenId);
    }

    function _reward(uint256 tokenId) internal virtual view returns(uint256) {
        uint256 record = records[tokenId];
        return record.sub(lastRewardRecords[tokenId]);
    }

    function rewardSurplus() public view override returns(uint256) {
        return _rewardSurplus();
    }

    function _rewardSurplus() public virtual view returns(uint256) {
        return 0;
    }

    function estimateReward(uint256 tokenId, uint256 amount) public view override returns(uint256) {
        return _estimateReward(tokenId, amount);
    }

    function _estimateReward(uint256 tokenId, uint256 amount) internal virtual view returns(uint256) {
        return records[tokenId].sub(lastRewardRecords[tokenId]).add(amount);
    }

    function setMultiplier(uint256 _multiplier) public override {
        uint256 oldMultiplier = multiplier;
        multiplier = _multiplier;
        emit MultiplierUpdated(oldMultiplier, _multiplier);
    }

    function withdraw(uint256 tokenId, uint256 amount) public override {
        address addr = _withdraw(tokenId, amount);
        emit Withdrawal(tokenId, addr, amount);
    }

    function _withdraw(uint256 tokenId, uint256 amount) internal virtual returns(address) {
        lastRewardRecords[tokenId] = records[tokenId];
        return address(0);
    }

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}

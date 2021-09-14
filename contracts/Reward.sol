// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metaTx/ERC2771Context.sol";
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
        _beforeFeed();
        records[tokenId] += amount;
        emit Feeding(tokenId, amount);
    }

    /**
    * @dev Hook that is called before any feed.
    */
    function _beforeFeed() internal virtual {}

    function batchFeed(FeedParam[] memory params) public virtual onlyOwner override {
        for (uint256 i = 0; i < params.length; i++) {
            FeedParam memory param = params[i];
            feed(param.tokenId, param.amount);
        }
    }

    function reward(uint256 tokenId) public view override returns(uint256) {
        return _reward(tokenId);
    }

    function _reward(uint256 tokenId) public virtual view returns(uint256) {
        uint256 record = records[tokenId];
        return record.sub(lastRewardRecords[tokenId]);
    }

    function setMultiplier(uint256 _multiplier) public override {
        multiplier = _multiplier;
    }

    function withdraw(uint256 tokenId) public override returns(uint256) {
        return _withdraw(tokenId);
    }

    function _withdraw(uint256 tokenId) public virtual returns(uint256) {
        lastRewardRecords[tokenId] = records[tokenId];
        return 0;
    }

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
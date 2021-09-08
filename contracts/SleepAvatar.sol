// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "./Avatar.sol";

contract SleepAvatar is Avatar {
    using Strings for uint256;
    using SafeMath for uint256;

    constructor() Avatar("Good Sleep Avatar Collection", "GSA") {}

    function _reward(uint256 tokenId) public view override returns(uint256) {
        // TODO: implement
        return records[tokenId];
    }

    function _withdraw(uint256 tokenId) public override returns(uint256) {
        // TODO: implement
        lastRewardRecords[tokenId] = records[tokenId];
        return 0;
    }

    function _baseURI() internal view virtual override(Avatar) returns (string memory) {
        return "www.goodata.io/metadata/sleepdata/";
    }
}
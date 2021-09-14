// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "./Reward.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract RewardV1 is Reward {
    ERC721 avatar;
    constructor(address _avatar, address trustedForwarder) Reward(trustedForwarder) {
        avatar = ERC721(_avatar);
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
}
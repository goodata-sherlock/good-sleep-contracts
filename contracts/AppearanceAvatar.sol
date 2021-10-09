// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Avatar.sol";

contract AppearanceAvatar is Avatar, Ownable {
    constructor(address trustedForwarder)
        Avatar("Good Appearance Avatar Collection", "GAA", trustedForwarder) {}

    function _baseURI() internal view virtual override(Avatar) returns (string memory) {
        return "https://goodata.io/metadata/appearance/";
    }

    function _mint(address to, uint256 tokenId) internal onlyOwner override virtual {
        super._mint(to, tokenId);
    }

    function _msgSender() internal view virtual override(Context, Avatar) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, Avatar) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
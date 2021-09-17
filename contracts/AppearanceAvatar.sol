// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "./Avatar.sol";

contract AppearanceAvatar is Avatar {
    constructor(address trustedForwarder)
        Avatar("Good Appearance Avatar Collection", "GAA", trustedForwarder) {}

    function _baseURI() internal view virtual override(Avatar) returns (string memory) {
        return "https://goodata.io/metadata/appearance/";
    }
}
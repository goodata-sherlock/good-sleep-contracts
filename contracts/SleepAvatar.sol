// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "./Avatar.sol";

contract SleepAvatar is Avatar {
    constructor(address trustedForwarder)
        Avatar("Good Sleep Avatar Collection", "GSA", trustedForwarder) {}

    function _baseURI() internal view virtual override(Avatar) returns (string memory) {
        return "https://goodata.io/metadata/sleepdata/";
    }
}
// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "./Avatar.sol";

contract SleepAvatar is Avatar {
    constructor() Avatar("Good Sleep Avatar Collection", "GSA") {}

    function _baseURI() internal view virtual override(Avatar) returns (string memory) {
        return "www.goodata.io/metadata/sleepdata/";
    }
}
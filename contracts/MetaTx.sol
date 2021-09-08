// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";

contract MetaTx is MinimalForwarder {
    constructor() MinimalForwarder() {}
}
// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockGooD is ERC20 {
    constructor() ERC20("Mock GooD", "GooD") {}
}
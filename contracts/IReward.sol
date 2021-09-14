// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

// interface IReward is IERC721, IERC721Metadata {
interface IReward {
    event ServiceAddrUpdated(address indexed oldAddr, address indexed newAddr);
    event Feeding(uint256 tokenId, uint256 amount);
    event MultiplierUpdated(uint256 oldMultiplier, uint256 newMultiplier);

    struct FeedParam {
        uint256 tokenId;
        uint256 amount;
    }

    function feed(uint256 tokenId, uint256 amount) external;
    function batchFeed(FeedParam[] memory params) external;
    
    function records(uint256 tokenId) external view returns(uint256);
    function lastRewardRecords(uint256 tokenId) external view returns(uint256);
    function reward(uint256 tokenId) external view returns(uint256);
    function multiplier() external view returns(uint256);
    function setMultiplier(uint256 _multiplier) external;
    function withdraw(uint256 tokenId) external returns(uint256);
}

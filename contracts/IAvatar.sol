// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";


// interface IAvatar is IERC721, IERC721Metadata {
interface IAvatar {
    event TokenURIUpdated(uint256 indexed tokenId, string uri);

    function setTokenURI(uint256 tokenId, string memory uri) external;
    function safeMint() external;
    function burn(uint256 tokenId) external;

    function createAvatar() external;
    function getCurrTokenId() external view returns (uint256);
}

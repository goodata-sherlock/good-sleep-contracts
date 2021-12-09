// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./interfaces/IAvatar.sol";

abstract contract Avatar is ERC2771Context, ERC721, ERC721URIStorage, ERC721Burnable, IAvatar {
    using Strings for uint256;
    using SafeMath for uint256;

    uint256 private _currentTokenId = 0;

    constructor(
        string memory name,
        string memory symbol,
        address trustedForwarder
    ) ERC721(name, symbol) ERC2771Context(trustedForwarder) {}

    function createAvatar() public virtual override {
        createAvatarTo(_msgSender());
    }

    function createAvatarTo(address to) public virtual {
        return createAvatar(to, "");
    }

    function createAvatar(address to, bytes memory _data) internal virtual {
        uint256 tokenId = _getNextTokenId();
        _incrementTokenId();
        _safeMint(to, tokenId, _data);
        _setTokenURI(tokenId, tokenId.toString());
    }

    function _baseURI() internal view virtual override(ERC721) returns (string memory) {
        return "";
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory uri) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Avatar: not owner or not be approved");
        _setTokenURI(tokenId, uri);
    }

    function _setTokenURI(uint256 tokenId, string memory uri) internal virtual override {
        super._setTokenURI(tokenId, uri);
        emit TokenURIUpdated(tokenId, uri);
    }

    /**
     * @dev Safely mints `nextTokenId` and transfers it to `to`.
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeMint() public virtual override {
        safeMint("");
    }

    /**
     * @dev Same as {xref-ERC721-_safeMint-address-uint256-}[`_safeMint`], with an additional `data` parameter which is
     * forwarded in {IERC721Receiver-onERC721Received} to contract recipients.
     */
    function safeMint(bytes memory _data) internal virtual {
        uint256 tokenId = _getNextTokenId();
        _incrementTokenId();
        _safeMint(_msgSender(), tokenId, _data);
    }

    function burn(uint256 tokenId) public virtual override(ERC721Burnable, IAvatar) {
        ERC721Burnable.burn(tokenId);
    }
    
    /**
     * @dev Destroys `tokenId`.
     * The approval is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual override(ERC721URIStorage, ERC721) {
        super._burn(tokenId);
    }

    function getCurrTokenId() public virtual override view returns (uint256) {
        return _currentTokenId;
    }

    /**
     * @dev calculates the next token ID based on value of _currentTokenId
     * @return uint256 for the next token ID
     */
    function _getNextTokenId() internal virtual view returns (uint256) {
        return _currentTokenId.add(1);
    }

    /**
     * @dev increments the value of _currentTokenId
     */
    function _incrementTokenId() internal virtual {
        _currentTokenId++;
    }

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}

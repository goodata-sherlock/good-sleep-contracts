// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/metaTx/ERC2771Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./IAvatar.sol";

abstract contract Avatar is ERC721, ERC721URIStorage, ERC721Burnable, IAvatar, Ownable, ERC2771Context {
    using Strings for uint256;
    using SafeMath for uint256;

    uint256 private _currentTokenId = 0;
    // tokenId => the number of records
    mapping (uint256 => uint256) public override records;
    mapping (uint256 => uint256) public override lastRewardRecords;
    uint256 public override multiplier;

    constructor(
        string memory name,
        string memory symbol,
        address trustedForwarder
    ) ERC721(name, symbol) ERC2771Context(trustedForwarder) {}

    function createAvatar() public virtual override {
        createAvatar("");
    }

    function createAvatar(bytes memory _data) internal virtual {
        uint256 tokenId = _getNextTokenId();
        _safeMint(_msgSender(), tokenId, _data);
        _incrementTokenId();
        setTokenURI(tokenId, _appendStr(_baseURI(), tokenId.toString()));
    }

    function feed(uint256 tokenId, uint256 amount) public virtual onlyOwner override {
        require(_exists(tokenId), "Avatar: Feed nonexistent avatar");
        records[tokenId] += amount;
        emit Feeding(tokenId, amount);
    }

    function batchFeed(FeedParam[] memory params) public virtual onlyOwner override {
        for (uint256 i = 0; i < params.length; i++) {
            FeedParam memory param = params[i];
            feed(param.tokenId, param.amount);
        }
    }

    function reward(uint256 tokenId) public view override returns(uint256) {
        return _reward(tokenId);
    }

    function _reward(uint256 tokenId) public virtual view returns(uint256) {
        uint256 record = records[tokenId];
        return record.sub(lastRewardRecords[tokenId]);
    }

    function setMultiplier(uint256 _multiplier) public override {
        multiplier = _multiplier;
    }

    function withdraw(uint256 tokenId) public override returns(uint256) {
        return _withdraw(tokenId);
    }

    function _withdraw(uint256 tokenId) public virtual returns(uint256) {
        lastRewardRecords[tokenId] = records[tokenId];
        return 0;
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

    function setTokenURI(uint256 tokenId, string memory uri) public virtual {
        require(_isApprovedOrOwner(_msgSender(), tokenId));
        return _setTokenURI(tokenId, uri);
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
    function safeMint() public virtual {
        _safeMint(_msgSender(), _getNextTokenId(), "");
        _incrementTokenId();
    }

    /**
     * @dev Same as {xref-ERC721-_safeMint-address-uint256-}[`_safeMint`], with an additional `data` parameter which is
     * forwarded in {IERC721Receiver-onERC721Received} to contract recipients.
     */
    function safeMint(bytes memory _data) internal virtual {
        _safeMint(_msgSender(), _getNextTokenId(), _data);
        _incrementTokenId();
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

    /**
     * @dev appends b to a
     */
    function _appendStr(string memory a, string memory b) internal virtual pure returns(string memory) {
        return string(abi.encodePacked(a, b));
    }

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
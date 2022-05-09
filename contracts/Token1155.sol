//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "./interfaces/IToken1155.sol";
import "./Token1155Storage.sol";


contract Token1155 is Token1155Storage, OwnableUpgradeable, AccessControlEnumerableUpgradeable, PausableUpgradeable, ERC1155Upgradeable, IToken1155 {
    using SafeMathUpgradeable for uint256;

    // uri is like "https://...../{id}.json", so _uriBase is without "{id}.json"
    function initialize(string memory _uriBase) external initializer {
        OwnableUpgradeable.__Ownable_init();
        baseMetadataURI = _uriBase;
        string memory uriCompleted = string(abi.encodePacked(baseMetadataURI, "{id}.json"));
        __ERC1155_init(uriCompleted);

        _mint(_msgSender(), RideOrDai, 100, "Hold JNT/SLICE since ICO"); // each can burn 250000 slice
        _mint(_msgSender(), Maxi, 5, "Buy from ICO with BTC and hold"); // each can burn 250000 slice
        _mint(_msgSender(), Ninja, 200, "Participate in JNT-SLICE Swap / hold"); // each can burn 50000 slice
        _mint(_msgSender(), HalfBaked, 5, "Contribute to the Tranche Protocol"); // each can burn 100000 slice
        _mint(_msgSender(), HighStakes, 25, "Stake $SLICE from Day 1"); // each can burn 100000 slice

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(URI_SETTER_ROLE, _msgSender());
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view override(AccessControlEnumerableUpgradeable, ERC1155Upgradeable) returns (bool) {
        return (
            interfaceId == type(IERC1155Upgradeable).interfaceId ||
            interfaceId == type(IERC1155MetadataURIUpgradeable).interfaceId ||
            super.supportsInterface(interfaceId)
        );
    }

    /**
     * @dev Total amount of tokens in with a given id.
     */
    function totalSupply(uint256 id) public view override returns (uint256) {
        return _totalSupply[id];
    }

    /**
     * @dev Indicates weither any token exist with a given id, or not.
     */
    function exists(uint256 id) external view override returns (bool) {
        return totalSupply(id) > 0;
    }

    // _uriBase like "https://...../" without "{id}.json"
    function uri(uint256 _id) override public view returns (string memory) {
        return(string(abi.encodePacked(baseMetadataURI, StringsUpgradeable.toString(_id), ".json")));
    }

    /**
     * @dev Creates `amount` new tokens for `to`, of token type `id`.
     *
     * See {ERC1155-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to,
            uint256 id,
            uint256 amount,
            bytes memory data) external whenNotPaused onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, data);
        _totalSupply[id] += amount;
    }

    // /**
    //  * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] variant of {mint}.
    //  */
    // function mintBatch(address to,
    //         uint256[] memory ids,
    //         uint256[] memory amounts,
    //         bytes memory data) external whenNotPaused onlyRole(MINTER_ROLE) {
    //     _mintBatch(to, ids, amounts, data);
    //     for (uint256 i = 0; i < ids.length; ++i) {
    //         _totalSupply[ids[i]] += amounts[i];
    //     }
    // }

    /**
     * @dev See {ERC1155-_burn}.
     */
    function burn(address account,
            uint256 id,
            uint256 amount) external override whenNotPaused {
        require(account == _msgSender() || isApprovedForAll(account, _msgSender()), "Token1155: caller is not owner nor approved");
        _burn(account, id, amount);
        _totalSupply[id] -= amount;
    }

    // /**
    //  * @dev See {ERC1155-_burnBatch}.
    //  */
    // function burnBatch(address account,
    //         uint256[] memory ids,
    //         uint256[] memory amounts) external whenNotPaused {
    //     require(account == _msgSender() || isApprovedForAll(account, _msgSender()), "Token1155: caller is not owner nor approved");
    //     _burnBatch(account, ids, amounts);
    //     for (uint256 i = 0; i < ids.length; ++i) {
    //         _totalSupply[ids[i]] -= amounts[i];
    //     }
    // }

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC1155Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public {
        require(hasRole(PAUSER_ROLE, _msgSender()), "Token1155: must have pauser role to pause");
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC1155Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public {
        require(hasRole(PAUSER_ROLE, _msgSender()), "Token1155: must have pauser role to unpause");
        _unpause();
    }

    function _beforeTokenTransfer(address operator,
            address from,
            address to,
            uint256[] memory ids,
            uint256[] memory amounts,
            bytes memory data) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        uint256 toIDsLen = _ownedIDTokens[to].length;
        for(uint256 j = 0; j < ids.length; j++) {
            bool found = false;
            uint256 i;
            for (i = 0; i < toIDsLen; i++) {
                if (_ownedIDTokens[to][i] == ids[j]) {
                    found = true;
                }
            }

            if (!found) {
                _ownedIDTokens[to].push(ids[j]);
            }

            if(from != address(0) && balanceOf(from, j) == 0) {
                _ownedIDTokens[to][j] = 0;
            }
        }
    }

    function tokenOfOwnerById(address owner, uint256 id) external view override returns (uint256) {
        return _ownedTokens[owner][id];
    }

    function getOwnerTokenIDLen(address _owner) external view override returns (uint256) {
        return _ownedIDTokens[_owner].length;
    }

    function getOwnerTokenIDValue(address _owner, uint256 index) external view override returns (uint256) {
        return _ownedIDTokens[_owner][index];
    }
}

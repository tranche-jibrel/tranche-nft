// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Token1155Storage {
    uint256 public constant PERCENT_DIVIDER = 100000;  // percentage divider, 6 decimals
    
    bytes4 constant private INTERFACE_SIGNATURE_URI = 0x0e89341c;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant URI_SETTER_ROLE = keccak256('URI_SETTER_ROLE');

    uint256 public constant RideOrDai = 1;
    uint256 public constant Maxi = 2;
    uint256 public constant Ninja = 3;
    uint256 public constant HalfBaked = 4;
    uint256 public constant HighStakes = 5;

    // Mapping from owner to list of owned token IDs
    mapping(address => mapping(uint256 => uint256)) public _ownedTokens;

    // Mapping from owner to list of owned token IDs
    mapping(address => uint256[]) public _ownedIDTokens;

    // totalSupply for tokenId
    mapping(uint256 => uint256) public _totalSupply;

    string public baseMetadataURI;
}
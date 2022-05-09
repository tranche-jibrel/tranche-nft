// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IToken1155 {
    // function getTokenWLAddress() external view returns (address);
    function totalSupply(uint256 id) external view returns (uint256);
    function exists(uint256 id) external view returns (bool);
    function tokenOfOwnerById(address owner, uint256 id) external view returns (uint256);
    function getOwnerTokenIDLen(address _owner) external view returns (uint256);
    function getOwnerTokenIDValue(address _owner, uint256 index) external view returns (uint256);
    function burn(address account, uint256 id, uint256 amount) external;
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IToken1155 {
    function totalSupplyById(uint256 id) external view returns (uint256);
    function exists(uint256 id) external view returns (bool);
    function burn(address account, uint256 id, uint256 amount) external;
}
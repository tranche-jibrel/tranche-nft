// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/ISlice.sol";


contract Slice is OwnableUpgradeable, ERC20Upgradeable, ISlice {
    using SafeMath for uint256;

    function initialize(uint256 _initialSupply) public initializer {
        OwnableUpgradeable.__Ownable_init();
        ERC20Upgradeable.__ERC20_init_unchained("SLICE", "SLC");
        _mint(msg.sender, _initialSupply.mul(1e18));
    }

    /**
     * @dev burns tokens
     * @param _amount amount to burn
     */
    function burn(uint256 _amount) external override {
        _burn(msg.sender, _amount);
    }

}

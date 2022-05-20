//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./interfaces/ISlice.sol";
import "./interfaces/IToken1155.sol";
import "./LogicStorage.sol";


contract Logic is LogicStorage, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeMathUpgradeable for uint256;

    function initialize(address _token1155, address _sliceAddress, address _treasury, address _stablecoin, uint256 _redeemFactor) external initializer {
        OwnableUpgradeable.__Ownable_init();
        token1155Address = _token1155;
        sliceAddress = _sliceAddress;
        treasuryAddress = _treasury;
        stablecoinAddress = _stablecoin;
        redemptionFactor = _redeemFactor;
    }

    function changeAddresses(address _token1155, address _sliceAddress, address _treasury, address _stablecoin) external onlyOwner {
        token1155Address = _token1155;
        sliceAddress = _sliceAddress;
        treasuryAddress = _treasury;
        stablecoinAddress = _stablecoin;
    }

    function changeRedemptionFactor(uint256 _redeemFactor) external onlyOwner {
        redemptionFactor = _redeemFactor;
    }

    /* functions to be used if user has to claim his own NFT tokens
    function populateClaimers(address _claimer, uint256 _id, uint256 _amount) public onlyOwner {
        addressList[_claimer][_id] = _amount;
    }

    function addressCanClaim(address _claimer, uint256 _id) public view returns (uint256) {
        return addressList[_claimer][_id];
    }

    function claimNFTs() external nonReentrant {
        uint256[] memory ids;
        uint256[] memory amounts;
        uint256 tmpAmounts;
        uint256 arrayIdx;
        for (uint256 i=1; i <= maxIdNumber; i++) {
            tmpAmounts = addressCanClaim(_msgSender(), i);
            if (tmpAmounts > 0) {
                addressList[_msgSender()][i] = 0;
                ids[arrayIdx] = i;
                amounts[arrayIdx] = tmpAmounts;
                arrayIdx = arrayIdx.add(1);
            }
        }
        if (amounts.length > 0) {
            IERC1155Upgradeable(token1155Address).safeBatchTransferFrom(nftOwnerAddress, _msgSender(), ids, amounts, "");
        }
    }
    */

    function destroyTokens(uint256 _id, uint256 _nftAmount, uint256 _sliceAmount) external nonReentrant returns (bool) {
        uint maxSliceAmount;
        
        if (_id == 1) {
            maxSliceAmount = uint256(2500).mul(_nftAmount).mul(1e18);
        } else if (_id == 2) {
            maxSliceAmount = uint256(50000).mul(_nftAmount).mul(1e18);
        } else if (_id == 3) {
            maxSliceAmount = uint256(250).mul(_nftAmount).mul(1e18);
        } else if (_id == 4) {
            maxSliceAmount = uint256(20000).mul(_nftAmount).mul(1e18);
        } else if (_id == 5) {
            maxSliceAmount = uint256(4000).mul(_nftAmount).mul(1e18);
        } else {
            return false;
        }
        require (_sliceAmount <= maxSliceAmount, "too much Slice to be burned");

        IToken1155(token1155Address).burn(_msgSender(), _id, _nftAmount);

        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(sliceAddress), _msgSender(), address(this), _sliceAmount);
        ISlice(sliceAddress).burn(_sliceAmount);

        // TODO: send stables to burner
        uint256 stableAmount = _sliceAmount.mul(redemptionFactor).div(1e18);
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(stablecoinAddress), treasuryAddress, _msgSender(), stableAmount);

        return true;
    }

}
require('dotenv').config();
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const { BN } = require('@openzeppelin/test-helpers');

const Token1155 = artifacts.require("Token1155");
const Slice = artifacts.require("Slice");
const StableCoin = artifacts.require("StableCoin");
const Logic = artifacts.require("Logic");

// const ADMIN_ROLE = 'a49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775'; //keccak256("ADMIN_ROLE");
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

module.exports = async (deployer, network, accounts) => {

  if (network == "development") {
    const MYSLICE_SUPPLY = new BN(20000000);
    const MYSTABLE_SUPPLY = new BN(10000000);
    const ERC1155_URI_BASE = "https://tranche.finance/"

    const tokenOwner = accounts[0];
    const treasury = accounts[9];

    const mySliceinstance = await deployProxy(Slice, [MYSLICE_SUPPLY], {from: tokenOwner});
    console.log('mySlice Address: ', mySliceinstance.address);

    const myStableCoininstance = await deployProxy(StableCoin, [MYSTABLE_SUPPLY], {from: tokenOwner});
    console.log('StableCoin Address: ', myStableCoininstance.address);

    const T1155instance = await deployProxy(Token1155, [ERC1155_URI_BASE], { from: tokenOwner });
    console.log('T1155instance Deployed: ', T1155instance.address);
    console.log('Is deployer T1155instance default admin: ', await T1155instance.hasRole(DEFAULT_ADMIN_ROLE, tokenOwner));

    const myLogicinstance = await deployProxy(Logic, [T1155instance.address, mySliceinstance.address, treasury, 
      myStableCoininstance.address, web3.utils.toWei("0.5")], {from: tokenOwner});
    console.log('Logic Address: ', myLogicinstance.address);
    
  } else if (network == "kovan") {

    let { IS_UPGRADE, PROXY_ADMIN_ADDRESS, TOKEN_ERC1155} = process.env;

    const accounts = await web3.eth.getAccounts();
    const tokenOwner = accounts[0];

    if (IS_UPGRADE == 'true') {
      console.log('contracts are being upgraded');

    } else {
      // deploy new contract
      try {
        const TF1155instance = await deployProxy(TokenFactory1155, [], { from: tokenOwner });
        console.log('TF1155instance Deployed: ', TF1155instance.address);
        console.log('Is deployer TF1155instance admin: ', await TF1155instance.hasRole(DEFAULT_ADMIN_ROLE, accounts[0]));

      } catch (error) {
        console.log(error);
      }
    } 
    
  }
};


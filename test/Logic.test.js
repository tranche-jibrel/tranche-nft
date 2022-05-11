const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

// const fs = require('fs');
// const deployedAddresses = JSON.parse(fs.readFileSync('./test/addresses.json', 'utf8'));

const Token1155 = artifacts.require('Token1155');
const Slice = artifacts.require("Slice");
const StableCoin = artifacts.require("StableCoin");
const Logic = artifacts.require("Logic");

contract('Token1155', function (accounts) {
    const [ tokenOwner, other1, other2 ] = accounts;
  
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
  
    // beforeEach(async function () {
    it('token setup', async function () {
        console.log("tokenOwner: " + tokenOwner);
    
        sliceContract = await Slice.deployed();
        expect(sliceContract.address).to.be.not.equal(ZERO_ADDRESS);
        expect(sliceContract.address).to.match(/0x[0-9a-fA-F]{40}/);
        console.log("Slice Contract Address: " + sliceContract.address);
        
        stableContract = await StableCoin.deployed();
        expect(stableContract.address).to.be.not.equal(ZERO_ADDRESS);
        expect(stableContract.address).to.match(/0x[0-9a-fA-F]{40}/);
        console.log("StableCoin Contract Address: " + stableContract.address);
    
        erc1155Contract = await Token1155.deployed();
        expect(erc1155Contract.address).to.be.not.equal(ZERO_ADDRESS);
        expect(erc1155Contract.address).to.match(/0x[0-9a-fA-F]{40}/);
        console.log("ERC1155 Token Factory: " + erc1155Contract.address);
        console.log('Is tokenOwner T1155 admin: ', await erc1155Contract.hasRole(DEFAULT_ADMIN_ROLE, tokenOwner));
    
        logicContract = await Logic.deployed();
        expect(logicContract.address).to.be.not.equal(ZERO_ADDRESS);
        expect(logicContract.address).to.match(/0x[0-9a-fA-F]{40}/);
        console.log("Logic Contract Address: " + logicContract.address);
    });

    it('token state and distribution', async function () {   

    });

});
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

// const fs = require('fs');
// const deployedAddresses = JSON.parse(fs.readFileSync('./test/addresses.json', 'utf8'));

const Token1155 = artifacts.require('Token1155');
const Slice = artifacts.require("Slice");
const StableCoin = artifacts.require("StableCoin");
const Logic = artifacts.require("Logic");

const fromWei = (x) => web3.utils.fromWei(x.toString());
const toWei = (x) => web3.utils.toWei(x.toString());

contract('Logic contract', function (accounts) {
    const [ tokenOwner, other1, other2 ] = accounts;
    const treasury = accounts[9];
  
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
        expect(await sliceContract.balanceOf(tokenOwner)).to.be.bignumber.equal(toWei(20000000));
        expect(await stableContract.balanceOf(tokenOwner)).to.be.bignumber.equal(toWei(10000000));

        await sliceContract.transfer(other1, toWei(1000000), { from: tokenOwner });
        await sliceContract.transfer(other2, toWei(2000000), { from: tokenOwner });
        expect(await sliceContract.balanceOf(other1)).to.be.bignumber.equal(toWei(1000000));
        expect(await sliceContract.balanceOf(other2)).to.be.bignumber.equal(toWei(2000000));

        await stableContract.transfer(treasury, toWei(1500000), { from: tokenOwner });
        expect(await stableContract.balanceOf(treasury)).to.be.bignumber.equal(toWei(1500000));

        expect(await erc1155Contract.balanceOf(tokenOwner, 1)).to.be.bignumber.equal('100');
        expect(await erc1155Contract.balanceOf(tokenOwner, 2)).to.be.bignumber.equal('5');
        expect(await erc1155Contract.balanceOf(tokenOwner, 3)).to.be.bignumber.equal('200');
        expect(await erc1155Contract.balanceOf(tokenOwner, 4)).to.be.bignumber.equal('5');
        expect(await erc1155Contract.balanceOf(tokenOwner, 5)).to.be.bignumber.equal('25');

        await erc1155Contract.safeBatchTransferFrom(tokenOwner, other1, [1, 2, 3, 4, 5], [20, 1, 50, 2, 8], 0x22, {from: tokenOwner});
        expect(await erc1155Contract.balanceOf(other1, 1)).to.be.bignumber.equal('20');
        expect(await erc1155Contract.balanceOf(other1, 2)).to.be.bignumber.equal('1');
        expect(await erc1155Contract.balanceOf(other1, 3)).to.be.bignumber.equal('50');
        expect(await erc1155Contract.balanceOf(other1, 4)).to.be.bignumber.equal('2');
        expect(await erc1155Contract.balanceOf(other1, 5)).to.be.bignumber.equal('8');

        await erc1155Contract.safeBatchTransferFrom(tokenOwner, other2, [1, 2, 3, 4, 5], [30, 2, 60, 1, 10], 0x33, {from: tokenOwner});
        expect(await erc1155Contract.balanceOf(other2, 1)).to.be.bignumber.equal('30');
        expect(await erc1155Contract.balanceOf(other2, 2)).to.be.bignumber.equal('2');
        expect(await erc1155Contract.balanceOf(other2, 3)).to.be.bignumber.equal('60');
        expect(await erc1155Contract.balanceOf(other2, 4)).to.be.bignumber.equal('1');
        expect(await erc1155Contract.balanceOf(other2, 5)).to.be.bignumber.equal('10');
    });

    describe('minting', function () {
        it('send only nft to logic contract --> no slice, no stables', async function () { 
            await erc1155Contract.setApprovalForAll(logicContract.address, true, {from: other1})
            // await sliceContract.approve(logicContract.address, toWei(1000000), {from: other1})
            await logicContract.destroyTokens(3, 5, 0, {from: other1});
            expect(await erc1155Contract.balanceOf(other1, 3)).to.be.bignumber.equal('45');
            expect(await sliceContract.balanceOf(other1)).to.be.bignumber.equal(toWei(1000000));
            expect(await stableContract.balanceOf(other1)).to.be.bignumber.equal(toWei(0));
        });

        it('send nft to logic contract with too much slice token to redeem --> revert', async function () { 
            await sliceContract.approve(logicContract.address, toWei(1000000), {from: other1});
            await expectRevert(logicContract.destroyTokens(3, 1, toWei(100000), {from: other1}), "too much Slice to be burned");
            expect(await erc1155Contract.balanceOf(other1, 3)).to.be.bignumber.equal('45');
            expect(await sliceContract.balanceOf(other1)).to.be.bignumber.equal(toWei(1000000));
            expect(await stableContract.balanceOf(other1)).to.be.bignumber.equal(toWei(0));
        });

        it('send enough nft tokens to logic contract with allowed amount slice token to redeem --> ok', async function () { 
            tx = await stableContract.approve(logicContract.address, toWei(1500000), {from: treasury});
            tx = await sliceContract.approve(logicContract.address, toWei(10000), {from: other1});

            tx = await logicContract.destroyTokens(3, 40, toWei(10000), {from: other1});
            expect(await erc1155Contract.balanceOf(other1, 3)).to.be.bignumber.equal('5');
            expect(await sliceContract.balanceOf(other1)).to.be.bignumber.equal(toWei(990000));
            expect(await stableContract.balanceOf(other1)).to.be.bignumber.equal(toWei(5000));
        });

        it('ading some test for increasing percentage', async function () {  
            tx = await logicContract.changeAddresses(erc1155Contract.address, sliceContract.address, treasury, stableContract.address, {from: tokenOwner});
            tx = await logicContract.changeRedemptionFactor(toWei(0.1), {from: tokenOwner});
            await logicContract.destroyTokens(1, 1, 0, {from: other1});
            await logicContract.destroyTokens(2, 1, 0, {from: other1});
            await logicContract.destroyTokens(4, 1, 0, {from: other1});
            await logicContract.destroyTokens(5, 1, 0, {from: other1});
        });
    });

});
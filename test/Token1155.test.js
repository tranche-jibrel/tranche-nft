const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

// const fs = require('fs');
// const deployedAddresses = JSON.parse(fs.readFileSync('./test/addresses.json', 'utf8'));

const Token1155 = artifacts.require('Token1155');
const Slice = artifacts.require("Slice");

const {shouldSupportInterfaces} = require("./SupportsInterface.behavior");

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

    erc1155Contract = await Token1155.deployed();
    expect(erc1155Contract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(erc1155Contract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log("ERC1155 Token Factory: " + erc1155Contract.address);
    console.log('Is tokenOwner T1155 admin: ', await erc1155Contract.hasRole(DEFAULT_ADMIN_ROLE, tokenOwner));

    this.token = erc1155Contract
  });

  shouldSupportInterfaces(['ERC1155'])

  it('tokenOwner has the default admin role', async function () {
    expect(await erc1155Contract.getRoleMemberCount(DEFAULT_ADMIN_ROLE)).to.be.bignumber.equal('1');
    expect(await erc1155Contract.getRoleMember(DEFAULT_ADMIN_ROLE, 0)).to.equal(tokenOwner);
  });

  it('tokenOwner has the minter role', async function () {
    expect(await erc1155Contract.getRoleMemberCount(MINTER_ROLE)).to.be.bignumber.equal('1');
    expect(await erc1155Contract.getRoleMember(MINTER_ROLE, 0)).to.equal(tokenOwner);
  });

  it('minter role admin is the default admin', async function () {
    expect(await erc1155Contract.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
  });

  describe('minting', function () {
    it('tokenOwner can mint tokens', async function () {
      const tokenId = new BN('100');

      const receipt = await erc1155Contract.mint(tokenOwner, tokenId, 3, 0x11, { from: tokenOwner });
      expectEvent(receipt, 'TransferSingle'/*, { operator: tokenOwner, from: ZERO_ADDRESS, to: other1, id: tokenId, amount: 3 }*/);

      expect(await erc1155Contract.balanceOf(tokenOwner, tokenId)).to.be.bignumber.equal('3');
    });

    // it('tokenOwner can mint batch tokens', async function () {
    //   const tokenId1 = new BN('12346');
    //   const tokenId2 = new BN('12347');
    //   const amount1 = new BN('5');
    //   const amount2 = new BN('1000');

    //   const receipt = await erc1155Contract.mintBatch(other1, [tokenId1, tokenId2], [amount1, amount2], 0x22, { from: tokenOwner });
    //   expectEvent(receipt, 'TransferBatch'/*, { operator: tokenOwner, from: ZERO_ADDRESS, to: other1, id: [tokenId1, tokenId2], amount: [amount1, amount2] }*/);
    // });

    it('other1 accounts cannot mint tokens', async function () {
      await expectRevert.unspecified(erc1155Contract.mint(other1, 111, 1111, 0x55, { from: other1 }));
    });
  });

  describe('pausing', function () {
    it('tokenOwner can pause', async function () {
      const receipt = await erc1155Contract.pause({ from: tokenOwner });
      expectEvent(receipt, 'Paused', { account: tokenOwner });

      expect(await erc1155Contract.paused()).to.equal(true);
    });

    it('tokenOwner can unpause', async function () {
      // await erc1155Contract.pause({ from: tokenOwner });

      const receipt = await erc1155Contract.unpause({ from: tokenOwner });
      expectEvent(receipt, 'Unpaused', { account: tokenOwner });

      expect(await erc1155Contract.paused()).to.equal(false);
    });

    it('cannot mint while paused', async function () {
      await erc1155Contract.pause({ from: tokenOwner });

      await expectRevert(
        erc1155Contract.mint(other1, 111, 1, 0x55, { from: tokenOwner }),
        'Pausable: paused',
      );
    });

    it('other1 accounts cannot pause', async function () {
      const receipt = await erc1155Contract.unpause({ from: tokenOwner });
      expectEvent(receipt, 'Unpaused', { account: tokenOwner });

      await expectRevert(
        erc1155Contract.pause({ from: other1 }),
        'Token1155: must have pauser role to pause',
      );
    });

    it('other1 accounts cannot unpause', async function () {
      await erc1155Contract.pause({ from: tokenOwner });

      await expectRevert(
        erc1155Contract.unpause({ from: other1 }),
        'Token1155: must have pauser role to unpause',
      );

      const receipt = await erc1155Contract.unpause({ from: tokenOwner });
      expectEvent(receipt, 'Unpaused', { account: tokenOwner });
    });
  });

  describe('burning', function () {
    it('holders can burn their tokens', async function () {
      const tokenId = new BN('0');

      await erc1155Contract.mint(other1, tokenId, 10, 0x55, { from: tokenOwner });

      const receipt = await erc1155Contract.burn(other1, tokenId, 2, { from: other1 });

      expectEvent(receipt, 'TransferSingle'/*, { from: other1, to: ZERO_ADDRESS, tokenId }*/);

      expect(await erc1155Contract.balanceOf(other1, tokenId)).to.be.bignumber.equal('8');
      expect(await erc1155Contract.totalSupply(tokenId)).to.be.bignumber.equal('8');
    });
  });
});

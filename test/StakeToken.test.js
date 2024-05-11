const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
describe("StakeToken", function () {
    let StakeToken;
    let stakeToken;
    let owner;
    let minter;
    let user;

    beforeEach(async function () {
        StakeToken = await ethers.getContractFactory("StakeToken");
        [owner, minter, user] = await ethers.getSigners();
        stakeToken = await StakeToken.deploy(owner.address, minter.address);
    });

    it("Should have the correct name and symbol", async function () {
        expect(await stakeToken.name()).to.equal("MyToken");
        expect(await stakeToken.symbol()).to.equal("MTK");
    });

    it("Should grant minter role to the specified address", async function () {
        expect(await stakeToken.hasRole(stakeToken.MINTER_ROLE(), minter.address)).to.be.true;
    });

    it("Should mint tokens to the specified address", async function () {
        const amount = ethers.utils.parseEther("100");
        await stakeToken.connect(minter).mint(user.address, amount);
        expect(await stakeToken.balanceOf(user.address)).to.equal(amount);
    });

    it("Should transfer tokens between accounts", async function () {
        const amount = ethers.utils.parseEther("100");
        await stakeToken.connect(minter).mint(user.address, amount);
        await stakeToken.connect(user).transfer(owner.address, amount);
        expect(await stakeToken.balanceOf(owner.address)).to.equal(amount);
    });

    it("Should not allow transfer to zero address", async function () {
        await expect(stakeToken.transfer(ethers.constants.AddressZero, ethers.utils.parseEther("100"))).to.be.revertedWith("ERC20: transfer to the zero address");
    });

    it("Should not allow transfer from zero address", async function () {
        await expect(stakeToken.transferFrom(ethers.constants.AddressZero, owner.address, ethers.utils.parseEther("100"))).to.be.revertedWith("ERC20: transfer from the zero address");
    });

    it("Should not allow transfer with zero amount", async function () {
        await expect(stakeToken.transfer(owner.address, 0)).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should not allow transferFrom with zero amount", async function () {
        await expect(stakeToken.transferFrom(user.address, owner.address, 0)).to.be.revertedWith("Amount must be greater than zero");
    });
});

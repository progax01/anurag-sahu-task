const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
describe("RewardToken", function () {
    let RewardToken;
    let rewardToken;
    let owner;
    let minter;
    let user;

    beforeEach(async function () {
        RewardToken = await ethers.getContractFactory("RewardToken");
        [owner, minter, user] = await ethers.getSigners();
        rewardToken = await RewardToken.deploy(owner.address, minter.address);
    });

    it("Should have the correct name and symbol", async function () {
        expect(await rewardToken.name()).to.equal("YourToken");
        expect(await rewardToken.symbol()).to.equal("YTK");
    });

    it("Should grant minter role to the specified address", async function () {
        expect(await rewardToken.hasRole(rewardToken.MINTER_ROLE(), minter.address)).to.be.true;
    });

    it("Should mint tokens to the specified address", async function () {
        const amount = ethers.utils.parseEther("100");
        await rewardToken.connect(minter).mint(user.address, amount);
        expect(await rewardToken.balanceOf(user.address)).to.equal(amount);
    });

    it("Should transfer tokens between accounts", async function () {
        const amount = ethers.utils.parseEther("100");
        await rewardToken.connect(minter).mint(user.address, amount);
        await rewardToken.connect(user).transfer(owner.address, amount);
        expect(await rewardToken.balanceOf(owner.address)).to.equal(amount);
    });

    it("Should not allow transfer to zero address", async function () {
        await expect(rewardToken.transfer(ethers.constants.AddressZero, ethers.utils.parseEther("100"))).to.be.revertedWith("ERC20: transfer to the zero address");
    });

    it("Should not allow transfer from zero address", async function () {
        await expect(rewardToken.transferFrom(ethers.constants.AddressZero, owner.address, ethers.utils.parseEther("100"))).to.be.revertedWith("ERC20: transfer from the zero address");
    });

    it("Should not allow transfer with zero amount", async function () {
        await expect(rewardToken.transfer(owner.address, 0)).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should not allow transferFrom with zero amount", async function () {
        await expect(rewardToken.transferFrom(user.address, owner.address, 0)).to.be.revertedWith("Amount must be greater than zero");
    });
});

const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
describe("StakingContract", function () {
    let StakingContract;
    let stakingContract;
    let owner;
    let user1;
    let user2;
    let stakingToken;
    let rewardToken;

    beforeEach(async function () {
        StakingContract = await ethers.getContractFactory("StakingContract");
        [owner, user1, user2] = await ethers.getSigners();
        
        // Deploy ERC20 tokens for staking and rewards
        const ERC20Token = await ethers.getContractFactory("ERC20");
        stakingToken = await ERC20Token.deploy("StakingToken", "STK");
        rewardToken = await ERC20Token.deploy("RewardToken", "REWARD");

        // Deploy StakingContract
        stakingContract = await StakingContract.deploy();
        await stakingContract.initialize(stakingToken.address, rewardToken.address, ethers.utils.parseEther("0.01"), owner.address);
    });

    it("Should stake tokens", async function () {
        const amount = ethers.utils.parseEther("10");
        await stakingToken.connect(user1).approve(stakingContract.address, amount);
        await stakingContract.connect(user1).stake(amount);
        expect(await stakingContract.stakedBalance(user1.address)).to.equal(amount);
    });

    it("Should withdraw staked tokens", async function () {
        const amount = ethers.utils.parseEther("10");
        await stakingToken.connect(user1).approve(stakingContract.address, amount);
        await stakingContract.connect(user1).stake(amount);
        await stakingContract.connect(user1).withdraw(amount);
        expect(await stakingContract.stakedBalance(user1.address)).to.equal(ethers.utils.parseEther("0"));
    });

    it("Should update rewards", async function () {
        const amount = ethers.utils.parseEther("10");
        await stakingToken.connect(user1).approve(stakingContract.address, amount);
        await stakingContract.connect(user1).stake(amount);
        await ethers.provider.send("evm_increaseTime", [3600]); // Increase time by 1 hour
        await stakingContract.updateRewards(user1.address);
        const rewardBalance = await rewardToken.balanceOf(user1.address);
        expect(rewardBalance).to.be.gt(0);
    });

    it("Should update reward rate", async function () {
        const newRewardRate = ethers.utils.parseEther("0.02");
        await stakingContract.updateRewardRate(newRewardRate);
        expect(await stakingContract.rewardRate()).to.equal(newRewardRate);
    });

    it("Should check reward amount", async function () {
        const amount = ethers.utils.parseEther("10");
        await stakingToken.connect(user1).approve(stakingContract.address, amount);
        await stakingContract.connect(user1).stake(amount);
        await ethers.provider.send("evm_increaseTime", [3600]); // Increase time by 1 hour
        const rewardAmount = await stakingContract.checkRewardAmount(user1.address);
        expect(rewardAmount).to.be.gt(0);
    });

    it("Should withdraw excess tokens", async function () {
        const amount = ethers.utils.parseEther("100");
        await rewardToken.transfer(stakingContract.address, amount);
        await stakingContract.withdrawExcessTokens(rewardToken.address, amount);
        expect(await rewardToken.balanceOf(owner.address)).to.equal(amount);
    });

    it("Should withdraw excess ETH", async function () {
        const amount = ethers.utils.parseEther("1");
        await stakingContract.send(amount);
        await stakingContract.withdrawExcessETH(amount);
        expect(await ethers.provider.getBalance(owner.address)).to.equal(amount);
    });
});

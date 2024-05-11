// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

contract StakingContract is OwnableUpgradeable, UUPSUpgradeable {
    // ERC20 token used for staking
    ERC20Upgradeable public stakingToken;

    // ERC20 token used for rewards
    ERC20Upgradeable public rewardToken;

    // Reward rate per staked token (reward tokens per staked token per second)
    uint256 public rewardRate;
    
    //Using SafeMath For security of Overflow and Underflow
    using SafeMathUpgradeable for uint256;
    
    // Timestamp when reward period starts
    uint256 public rewardPeriodStart;

    // Mapping of user staked balances
    mapping(address => uint256) public stakedBalance;

    // Mapping of user's last updated reward
    mapping(address => uint256) public lastRewardUpdate;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsUpdated(uint256 newRewardRate);
    event RewardsDistributed(address indexed user, uint256 amount);

    function initialize(address _stakingToken, address _rewardToken, uint256 _rewardRate, address owner) public initializer {
        __Ownable_init(owner);
        __UUPSUpgradeable_init();
        stakingToken = ERC20Upgradeable(_stakingToken);
        rewardToken = ERC20Upgradeable(_rewardToken);
        rewardRate = _rewardRate;
        rewardPeriodStart = block.timestamp;
    }

    // Stake tokens
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Stake failed");
        
        updateRewards(msg.sender);

         stakedBalance[msg.sender] = stakedBalance[msg.sender].add(amount);
        emit Staked(msg.sender, amount);
    }

    // Withdraw staked tokens
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");

        updateRewards(msg.sender);

        stakedBalance[msg.sender] = stakedBalance[msg.sender].sub(amount);
        require(stakingToken.transfer(msg.sender, amount), "Withdrawal failed");
        emit Withdrawn(msg.sender, amount);
    }

    // Update rewards for a user
    function updateRewards(address user) internal {
        
        uint256 elapsedTime = block.timestamp.sub(lastRewardUpdate[user]);

        uint256 rewardAmount = stakedBalance[user].mul(elapsedTime).mul(rewardRate);

        if (rewardAmount > 0) {
            require(rewardToken.transfer(user, rewardAmount), "Reward transfer failed");
            emit RewardsDistributed(user, rewardAmount);
        }

        lastRewardUpdate[user] = block.timestamp;
    }

    // Update reward rate by the owner
    function updateRewardRate(uint256 newRewardRate) external onlyOwner {
        rewardRate = newRewardRate;
        rewardPeriodStart = block.timestamp;
        emit RewardsUpdated(newRewardRate);
    }

   // Check the amount of rewards generated for a user
    function checkRewardAmount(address user) external view returns (uint256) {
         uint256 elapsedTime = block.timestamp.sub(lastRewardUpdate[user]);
        return stakedBalance[user].mul( elapsedTime).mul( rewardRate);
            // uint256 rewardAmount = stakedBalance[user].mul(elapsedTime).mul(rewardRate);
    }

    // Function to allow the owner to withdraw any ERC20 tokens accidentally sent to the contract
    function withdrawExcessTokens(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(stakingToken) && tokenAddress != address(rewardToken), "Cannot withdraw staking or reward tokens");
        ERC20Upgradeable(tokenAddress).transfer(owner(), amount);
    }

    // Function to allow the owner to withdraw ETH accidentally sent to the contract
    function withdrawExcessETH(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }

        function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}



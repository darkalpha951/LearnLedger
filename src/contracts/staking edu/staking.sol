 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SimpleStaking is Ownable, ReentrancyGuard {
    // Staked token (e.g., EDU)
    IERC20 public stakingToken;
    // Reward token (can be the same as staking token)
    IERC20 public rewardToken;
    
    // Minimum lock period (2 weeks)
    uint256 public constant MINIMUM_LOCK_PERIOD = 2 weeks;
    
    // Annual reward rate in basis points (e.g., 1000 = 10%)
    uint256 public rewardRate = 1000;
    
    struct StakeInfo {
        uint256 amount;        // Amount staked
        uint256 startTime;     // Time when stake was created
        uint256 lastClaimTime; // Last time rewards were claimed
    }
    
    // Mapping of user address to their stake info
    mapping(address => StakeInfo) public stakes;
    
    // Total staked amount
    uint256 public totalStaked;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    
    constructor(address _stakingToken, address _rewardToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }
    
    /**
     * @notice Stake tokens
     * @param _amount Amount to stake (in whole tokens, not wei)
     */
    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0");
        
        // Convert _amount to wei (e18)
        uint256 amountInWei = _amount * 1e18;
        
        // Update rewards before modifying stake
        _updateReward(msg.sender);
        
        // Transfer tokens from user to contract
        require(stakingToken.transferFrom(msg.sender, address(this), amountInWei), "Transfer failed");
        
        // Update stake information
        StakeInfo storage userStake = stakes[msg.sender];
        
        // If this is a new stake, set the start time
        if (userStake.amount == 0) {
            userStake.startTime = block.timestamp;
            userStake.lastClaimTime = block.timestamp;
        }
        
        userStake.amount += amountInWei;
        totalStaked += amountInWei;
        
        emit Staked(msg.sender, amountInWei);
    }
    
    /**
     * @notice Unstake tokens after lock period
     * @param _amount Amount to unstake (in whole tokens, not wei)
     */
    function unstake(uint256 _amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        
        // Convert _amount to wei (e18)
        uint256 amountInWei = _amount * 1e18;
        
        require(userStake.amount >= amountInWei, "Insufficient staked amount");
        require(block.timestamp >= userStake.startTime + MINIMUM_LOCK_PERIOD, "Lock period not ended");
        
        // Update rewards before modifying stake
        _updateReward(msg.sender);
        
        // Update stake information
        userStake.amount -= amountInWei;
        totalStaked -= amountInWei;
        
        // If fully unstaked, reset start time
        if (userStake.amount == 0) {
            userStake.startTime = 0;
        }
        
        // Transfer tokens back to user
        require(stakingToken.transfer(msg.sender, amountInWei), "Transfer failed");
        
        emit Unstaked(msg.sender, amountInWei);
    }
    
    /**
     * @notice Claim accumulated rewards
     */
    function claimReward() external nonReentrant {
        uint256 reward = _updateReward(msg.sender);
        
        if (reward > 0) {
            require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");
            emit RewardClaimed(msg.sender, reward);
        }
    }
    
    /**
     * @notice Calculate pending rewards for a user
     * @param _user Address of the user
     * @return Pending reward amount
     */
    function pendingReward(address _user) public view returns (uint256) {
        StakeInfo storage userStake = stakes[_user];
        
        if (userStake.amount == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - userStake.lastClaimTime;
        
        // Calculate reward: amount * rate * timeElapsed / (365 days * 10000)
        // Rate is in basis points (1/100 of a percent)
        return (userStake.amount * rewardRate * timeElapsed) / (365 days * 10000);
    }
    
    /**
     * @notice Update reward for a user
     * @param _user Address of the user
     * @return Reward amount
     */
    function _updateReward(address _user) internal returns (uint256) {
        uint256 reward = pendingReward(_user);
        
        if (reward > 0) {
            stakes[_user].lastClaimTime = block.timestamp;
        }
        
        return reward;
    }
    
    /**
     * @notice Set reward rate (owner only)
     * @param _rewardRate New reward rate in basis points
     */
    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
    }
    
    /**
     * @notice Get staking information for a user
     * @param _user Address of the user
     * @return amount Amount staked (in whole tokens)
     * @return startTime Time when stake was created
     * @return lockEndTime Time when lock period ends
     * @return pendingRewards Pending rewards (in wei)
     */
    function getStakeInfo(address _user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lockEndTime,
        uint256 pendingRewards
    ) {
        StakeInfo storage userStake = stakes[_user];
        
        return (
            userStake.amount / 1e18, // Convert wei to whole tokens for display
            userStake.startTime,
            userStake.startTime + MINIMUM_LOCK_PERIOD,
            pendingReward(_user)
        );
    }
}


//0x2ae15F4EdE5bA81E03489384E22B40be5c2a8Ec6
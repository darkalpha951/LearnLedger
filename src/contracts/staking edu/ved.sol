// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VEDToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 3_000_000_000 * 10**18; // 3 billion tokens
    uint256 public constant DISTRIBUTION_AMOUNT = 300_000_000 * 10**18; // 300 million per distribution
    
    // Points tracking
    mapping(address => uint256) public userPoints;
    uint256 public totalPoints;
    
    // Track users with points
    address[] private usersWithPoints;
    mapping(address => bool) private hasPoints;
    
    event PointsUpdated(address indexed user, uint256 points);
    event PointsDistributionCompleted(uint256 totalDistributed, uint256 totalPoints);
    
    constructor() ERC20("Virtual Education Dollar", "VED") Ownable(msg.sender) {
        // No need to track lastDistributionTime anymore
    }
    
    function updatePoints(address[] calldata _users, uint256[] calldata _points) external onlyOwner {
        require(_users.length == _points.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _users.length; i++) {
            // Subtract old points from total
            totalPoints -= userPoints[_users[i]];
            
            // Update user points
            userPoints[_users[i]] = _points[i];
            
            // Add new points to total
            totalPoints += _points[i];
            
            // Track users with points
            if (_points[i] > 0 && !hasPoints[_users[i]]) {
                usersWithPoints.push(_users[i]);
                hasPoints[_users[i]] = true;
            }
            
            emit PointsUpdated(_users[i], _points[i]);
        }
    }
    
    function distributeRewards() external onlyOwner {
        require(totalPoints > 0, "No points to distribute");
        require(totalSupply() + DISTRIBUTION_AMOUNT <= MAX_SUPPLY, "Would exceed max supply");
        
        uint256 amountToDistribute = DISTRIBUTION_AMOUNT;
        uint256 distributedAmount = 0;
        
        for (uint256 i = 0; i < usersWithPoints.length; i++) {
            address user = usersWithPoints[i];
            if (userPoints[user] > 0) {
                uint256 userReward = (amountToDistribute * userPoints[user]) / totalPoints;
                _mint(user, userReward);
                distributedAmount += userReward;
            }
        }
        
        emit PointsDistributionCompleted(distributedAmount, totalPoints);
        
        // Reset points for next period
        resetAllPoints();
    }
    
    function resetAllPoints() internal {
        // Clear all points
        for (uint256 i = 0; i < usersWithPoints.length; i++) {
            userPoints[usersWithPoints[i]] = 0;
            hasPoints[usersWithPoints[i]] = false;
        }
        
        // Clear users array
        delete usersWithPoints;
        
        // Reset total points
        totalPoints = 0;
    }
    
    function getUsersWithPoints() external view returns (address[] memory) {
        return usersWithPoints;
    }
}
//0x0Ff2a864FE33DA120e726797c703bbf12C95c999

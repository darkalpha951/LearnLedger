// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EDUToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Education Token", "EDU") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
    
    // Mint additional tokens (only owner)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    // Burn tokens from caller's address
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
//0xD1F62FFeb999422045c8C3c1F3eabf36492f4f4f
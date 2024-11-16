// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        // Optional: mint some initial supply to deployer
        _mint(msg.sender, 1000000 * 10**18);
    }

    // Public mint function for testing purposes
    // Anyone can mint up to 1000 USDC at a time
    function mint(uint256 amount) external {
        _mint(msg.sender, amount * 10**18); // Mint 1000 USDC
    }
}

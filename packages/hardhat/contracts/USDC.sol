// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDC is ERC20 {
    uint8 private constant DECIMALS = 6; // USDC uses 6 decimals instead of 18

    constructor() ERC20("USD Coin", "USDC") {
        // Optional: mint some initial supply to deployer
        _mint(msg.sender, 1000000 * 10**DECIMALS);
    }

    // Override decimals to match real USDC
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    // Public mint function for testing purposes
    // Anyone can mint up to 1000 USDC at a time
    function mint() external {
        _mint(msg.sender, 1000 * 10**DECIMALS); // Mint 1000 USDC
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./RewardsMock.sol";

contract RewardsV2Mock is RewardsMock {
    function calculateReward(uint256, uint256, bool) internal pure override returns (uint256) {
        return 0; // Always return 0
    }
}

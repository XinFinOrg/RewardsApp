// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./Rewards.sol";

contract RewardsMock is Rewards {
    function mockMarkEpochWithRewardsCalculated(uint256 epoch) public {
        markEpochWithRewardsCalculated(epoch);
    }

    function mockRequireRewardsNotCalculated(uint256 epoch) public view {
        requireRewardsNotCalculated(epoch);
    }

    function mockProcessStandbyNode(
        uint256 chainReward,
        address node,
        uint256 epoch
    ) public {
        processStandbyNode(chainReward, node, epoch);
    }

    function mockCalculateRewards(uint256 chainReward, uint256 verifiedBlocks, bool slashed) public view returns (uint256) {
        return calculateReward(chainReward, verifiedBlocks, slashed);
    }

    function mockCalculateReward(uint256 chainReward, uint256 verifiedBlocks, bool slashed) public view returns (uint256) {
        return calculateReward(chainReward, verifiedBlocks, slashed);
    }

    function mockIsSlashed(address node, uint256 epoch) public view returns (bool) {
        return isSlashed(node, epoch);
    }

    function mockSlashNode(address node, uint256 untilEpoch) public {
        slashNode(node, untilEpoch);
    }

    function mockShouldSlash(uint256 verifiedBlocks) public pure returns (bool) {
        return shouldSlash(verifiedBlocks);
    }

    function mockSetStandbyNodeBlocksConfirmedHistory(uint256 newValue) public {
        standbyNodeBlocksConfirmedHistory[currentEpoch] = newValue;
    }

    function mockCountConfirmedBlocks(bytes32[] memory blockHashes, address[] memory standbyNodes) public {
        countConfirmedBlocks(blockHashes, standbyNodes);
    }

    function mockGetPendingRewardsTransaction(address _address) public view returns (uint256) {
        return pendingRewardsTransaction[_address];
    }
}

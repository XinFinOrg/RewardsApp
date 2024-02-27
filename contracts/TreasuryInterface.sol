// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface TreasuryInterface {
    function createTransaction(address _to, uint256 _value) external returns (uint256);
    function confirmTransaction(uint256 _transactionId) external;
}
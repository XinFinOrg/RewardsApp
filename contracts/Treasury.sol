// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

contract Treasury {
    address[] public owners;
    uint256 public requiredConfirmations;

    mapping(address => bool) public isOwner;
    mapping(uint256 => mapping(address => bool)) public isConfirmed;

    event Deposit(address indexed sender, uint256 value);
    event TransactionCreated(address indexed sender, address indexed to, uint256 value, uint256 indexed transactionId);
    event TransactionConfirmed(address indexed sender, uint256 indexed transactionId);
    event TransactionExecuted(address indexed sender, uint256 indexed transactionId);

    struct Transaction {
        uint256 id;
        address payable from;
        address payable to;
        uint256 value;
        bool executed;
    }

    Transaction[] public transactions;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier transactionExists(uint256 transactionId) {
        require(transactionId < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 transactionId) {
        require(!transactions[transactionId].executed, "Transaction already executed");
        _;
    }

    modifier confirmedByOwner(uint256 transactionId) {
        require(isConfirmed[transactionId][msg.sender], "Transaction not confirmed by owner");
        _;
    }

    constructor(address[] memory _owners, uint256 _requiredConfirmations) {
        require(_owners.length > 0, "Owners required");
        require(_requiredConfirmations > 0 && _requiredConfirmations <= _owners.length, "Invalid number of required confirmations");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0) && !isOwner[owner], "Invalid owner address");
            isOwner[owner] = true;
            owners.push(owner);
        }

        requiredConfirmations = _requiredConfirmations;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function createTransaction(address payable to, uint256 value) external onlyOwner returns (uint256) {
        uint256 transactionId = transactions.length;

        transactions.push(Transaction({
            id: transactionId,
            from: payable(msg.sender),
            to: to,
            value: value,
            executed: false
        }));

        emit TransactionCreated(msg.sender, to, value, transactionId);

        return transactionId;
    }

    function confirmTransaction(uint256 transactionId) external onlyOwner transactionExists(transactionId) notExecuted(transactionId) {
        require(!isConfirmed[transactionId][msg.sender], "Transaction already confirmed by owner");

        isConfirmed[transactionId][msg.sender] = true;
        emit TransactionConfirmed(msg.sender, transactionId);

        if (isConfirmedByAll(transactionId)) {
            executeTransaction(transactionId);
        }
    }

    function executeTransaction(uint256 transactionId) internal notExecuted(transactionId) {
        Transaction storage transaction = transactions[transactionId];

        require(isConfirmedByAll(transactionId), "Not enough confirmations");

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}("");
        require(success, "Transaction execution failed");

        emit TransactionExecuted(msg.sender, transactionId);
    }

    function isConfirmedByAll(uint256 transactionId) public view returns (bool) {
        uint256 count = 0;

        for (uint256 i = 0; i < owners.length; i++) {
            if (isConfirmed[transactionId][owners[i]]) {
                count++;
            }

            if (count == requiredConfirmations) {
                return true;
            }
        }

        return false;
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    function getPendingTransactions() external view onlyOwner returns (Transaction[] memory) {
        uint256 pendingCount = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            if (!transactions[i].executed) {
                pendingCount++;
            }
        }

        Transaction[] memory pendingTransactions = new Transaction[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            if (!transactions[i].executed) {
                pendingTransactions[index] = transactions[i];
                index++;
            }
        }

        return pendingTransactions;
    }

    function getTransactionsForAddress(address _address) external view returns (Transaction[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].to == _address) {
                count++;
            }
        }

        Transaction[] memory addressTransactions = new Transaction[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].to == _address) {
                addressTransactions[index] = transactions[i];
                index++;
            }
        }

        return addressTransactions;
    }

    function getTransactionCountForAddress(address _address) external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].to == _address) {
                count++;
            }
        }
        return count;
    }
}

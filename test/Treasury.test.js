const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Treasury Contract", function () {
  let Treasury;
  let treasury;
  let owner;
  let addr1;
  let addr2;
  let owner1;
  let owner2;
  let addrs;

  beforeEach(async function () {
    Treasury = await ethers.getContractFactory("Treasury");
    [owner, addr1, addr2, owner1, owner2, ...addrs] = await ethers.getSigners();
    treasury = await Treasury.deploy([owner.address, owner1.address, owner2], 2);
    await treasury.waitForDeployment();
    await owner.sendTransaction({
      to: await treasury.getAddress(),
      value: ethers.parseEther("200.0"), 
    });
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await treasury.isOwner(owner.address)).to.equal(true);
    });

    it("Should set the required confirmations", async function () {
      expect(await treasury.requiredConfirmations()).to.equal(2);
    });
  });

  describe("Functions", function () {
    it("Should create a transaction", async function () {
      await treasury.createTransaction(addr1.address, 100);
      const transaction = await treasury.transactions(0);
      expect(transaction.to).to.equal(addr1.address);
      expect(transaction.value).to.equal(100);
      expect(transaction.executed).to.equal(false);
    });

    it("Should confirm a transaction", async function () {
      await treasury.createTransaction(addr1.address, 100);
      await treasury.confirmTransaction(0);
      const isConfirmed = await treasury.isConfirmed(0, owner.address);
      expect(isConfirmed).to.equal(true);
    });

    it("Should execute a transaction", async function () {
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      await treasury.createTransaction(addr1.address, 100);
      await treasury.confirmTransaction(0);
      await treasury.connect(owner1).confirmTransaction(0);
      const transaction = await treasury.transactions(0);
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance-initialBalance).to.equal(100);
    });

    it("Should get transaction count", async function () {
      await treasury.createTransaction(addr1.address, 100);
      await treasury.createTransaction(addr2.address, 200);
      const transactionCount = await treasury.getTransactionCount();
      expect(transactionCount).to.equal(2);
    });

    it("Should get pending transactions", async function () {
      await treasury.createTransaction(addr1.address, 100);
      await treasury.createTransaction(addr2.address, 200);
      await treasury.confirmTransaction(0);
      await treasury.connect(owner1).confirmTransaction(0);
      const pendingTransactions = await treasury.getPendingTransactions();
      expect(pendingTransactions.length).to.equal(1);
      expect(pendingTransactions[0].to).to.equal(addr2.address);
    });

    it("Should not allow non-owners to create transactions", async function () {
      await expect(treasury.connect(addr1).createTransaction(addr1.address, 100)).to.be.revertedWith("Not an owner");
    });

    it("Should not allow non-owners to confirm transactions", async function () {
      await treasury.createTransaction(addr1.address, 100);
      await expect(treasury.connect(addr1).confirmTransaction(0)).to.be.revertedWith("Not an owner");
    });

    it("Should not allow confirming a transaction twice by the same owner", async function () {
      await treasury.createTransaction(addr1.address, 100);
      await treasury.confirmTransaction(0);
      await expect(treasury.confirmTransaction(0)).to.be.revertedWith("Transaction already confirmed by owner");
    });

    it("Should not allow confirming a non-existent transaction", async function () {
      await expect(treasury.confirmTransaction(0)).to.be.revertedWith("Transaction does not exist");
    });

    it("Should not allow confirming an already executed transaction", async function () {
      await treasury.createTransaction(addr1.address, 100);
      await treasury.confirmTransaction(0);
      await treasury.connect(owner1).confirmTransaction(0);
      await expect(treasury.connect(owner2).confirmTransaction(0)).to.be.revertedWith("Transaction already executed");
    });

  });
});

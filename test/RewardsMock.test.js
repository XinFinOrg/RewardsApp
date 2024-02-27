const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Rewards Contract", function () {
  let RewardsMock;
  let rewards;
  let blockSigner;
  let treasury;
  let owner;
  let addr1;
  let addrs;

  beforeEach(async function () {
    [owner, addr1, ...addrs] = await ethers.getSigners();

    // Deploy BlockSigner contract
    const BlockSigner = await ethers.getContractFactory("BlockSigner");
    blockSigner = await BlockSigner.deploy(1000);
    await blockSigner.waitForDeployment();

    // Deploy RewardsMock instead of Rewards
    RewardsMock = await ethers.getContractFactory("RewardsMock");
    rewards = await upgrades.deployProxy(RewardsMock, [await blockSigner.getAddress(), 3, 1], { initializer: 'initialize' });
    await rewards.waitForDeployment();

    // Deploy Treasury contract
    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy([await rewards.getAddress(), owner.address], 2);
    await treasury.waitForDeployment();

    await owner.sendTransaction({
        to: await treasury.getAddress(),
        value: ethers.parseEther("200.0"), 
    });

    await rewards.setTreasuryAddress(await treasury.getAddress());


});

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await rewards.owner()).to.equal(owner.address);
    });

    it("Should set the initial epoch", async function () {
      expect(await rewards.currentEpoch()).to.equal(1);
    });
  });

  describe("Functions", function () {
    it("Should increment current epoch by owner", async function () {
        await rewards.setCurrentEpochByOwner(10);
        expect(await rewards.currentEpoch()).to.equal(10);
      });
  
      it("Should add and remove whitelisted addresses", async function () {
        await rewards.addWhitelisted(addr1.address);
        expect(await rewards.whitelist(addr1.address)).to.equal(true);
  
        await rewards.removeWhitelisted(addr1.address);
        expect(await rewards.whitelist(addr1.address)).to.equal(false);
      });
  
      it("Should calculate rewards correctly when not slashed", async function () {
        // Mocking necessary values for calculation
        const chainReward = 1000;
        const verifiedBlocks = 5;
        const slashed = false;

        await rewards.mockSetStandbyNodeBlocksConfirmedHistory(20);
  
        const rewardsCalculated = await rewards.mockCalculateReward(chainReward, verifiedBlocks, slashed);
        expect(rewardsCalculated).to.equal(250); // 1000 / 20 * 5 = 250
      });
  
      it("Should calculate rewards correctly when slashed", async function () {
        // Mocking necessary values for calculation
        const chainReward = 1000;
        const verifiedBlocks = 5;
        const slashed = true;

        await rewards.mockSetStandbyNodeBlocksConfirmedHistory(20);
  
        const rewardsCalculated = await rewards.mockCalculateReward(chainReward, verifiedBlocks, slashed);
        expect(rewardsCalculated).to.equal(0); // Slashed, so rewards should be 0
      });
  
      it("Should calculate rewards correctly when total signers are zero", async function () {
        // Mocking necessary values for calculation
        const chainReward = 1000;
        const verifiedBlocks = 5;
        const slashed = false;
  
        // Set standbyNodeBlocksConfirmedHistory to zero
        await rewards.mockSetStandbyNodeBlocksConfirmedHistory(0);
  
        const rewardsCalculated = await rewards.mockCalculateReward(chainReward, verifiedBlocks, slashed);
        expect(rewardsCalculated).to.equal(0); // Total signers are zero, so rewards should be 0
      });
  
      it("Should calculate rewards correctly when verified blocks are zero", async function () {
        // Mocking necessary values for calculation
        const chainReward = 1000;
        const verifiedBlocks = 0;
        const slashed = false;
  
        // Set standbyNodeBlocksConfirmedHistory to a non-zero value
        await rewards.mockSetStandbyNodeBlocksConfirmedHistory(20);
  
        const rewardsCalculated = await rewards.mockCalculateReward(chainReward, verifiedBlocks, slashed);
        expect(rewardsCalculated).to.equal(0); // Verified blocks are zero, so rewards should be 0
      });
  
      it("Should fail to calculate rewards for the same epoch twice", async function () {
        const currentEpoch = await rewards.currentEpoch();
        const epoch = Number(currentEpoch) + 1;
  
        // First attempt to calculate rewards for the epoch
        await rewards.calculateRewards(1000, [], [], epoch);
        expect(await rewards.epochsWithRewardsCalculated(epoch)).to.equal(true);
  
        // Second attempt to calculate rewards for the same epoch
        await expect(rewards.calculateRewards(1000, [], [], epoch)).to.be.revertedWith("Invalid epoch");
      });
  
      it("Should fail to calculate rewards for non-consecutive epochs", async function () {
        const currentEpoch = await rewards.currentEpoch();
        const epochToCalculate = Number(currentEpoch) + 2; // Attempt to calculate rewards for a non-consecutive epoch
  
        await expect(rewards.calculateRewards(1000, [], [], epochToCalculate)).to.be.revertedWith("Invalid epoch");
      });
  
      it("Should process standby node correctly", async function () {
        // Mocking necessary values for processing
        const chainReward = 1000;
        const node = addrs[0].address;
        const epoch = 1;
  
        await rewards.mockProcessStandbyNode(chainReward, node, epoch);
        expect(await rewards.epochsWithRewardsCalculatedForNode(epoch, node)).to.equal(true);
      });

      it("Should count confirmed blocks correctly", async function () {
        // Confirm some blocks by signing them with the BlockSigner contract
        const blockHashes = [];
        const standbyNodes = addrs; // Assuming these are the standby nodes
        for (let i = 0; i < 5; i++) {
            const blockHash = ethers.keccak256(ethers.randomBytes(32));
            for (let j = 0; j < standbyNodes.length; j++) {
                await blockSigner.connect(standbyNodes[j]).sign(i, blockHash); // Each address signs the same block
            }
            blockHashes.push(blockHash);
        }
      
        // Call the countConfirmedBlocks function of the Rewards contract
        await rewards.mockCountConfirmedBlocks(blockHashes, standbyNodes);
      
        // Verify that the standbyNodeBlocksConfirmedHistory mapping is updated correctly
        const currentEpoch = await rewards.currentEpoch();
        const standbyNodeBlocksConfirmed = await rewards.standbyNodeBlocksConfirmedHistory(currentEpoch);
        expect(standbyNodeBlocksConfirmed).to.equal(5*standbyNodes.length); // Assuming all blocks are confirmed by standby nodes
    });

    it("Should transfer rewards correctly on reward transfer epoch", async function () {
        // Confirm some blocks by signing them with the BlockSigner contract
        const blockHashes = [];
        const standbyNodes = addrs; // Assuming these are the standby nodes
        for (let i = 0; i < 5; i++) {
            const blockHash = ethers.keccak256(ethers.randomBytes(32));
            await blockSigner.connect(standbyNodes[0]).sign(i, blockHash); // Each address signs the same block
            blockHashes.push(blockHash);
        }
    
        const chainReward = 1000;
        const epoch = 2;

        await rewards.setRewardTransferEpoch(1);
    
        await rewards.calculateRewards(chainReward, blockHashes, standbyNodes, epoch);
    
        // Check if rewards are transferred correctly
        const transaction = await treasury.transactions(0);
        expect(transaction.to).to.equal(standbyNodes[0]);
        expect(transaction.value).to.equal(1000/5*5);
    });

    it("Should transfer rewards correctly during reward transfer epoch", async function () {

        // Confirm some blocks by standby nodes for the current epoch
        const blockHashes = [];
        const standbyNodes = addrs; // Assuming these are the standby nodes
        for (let i = 0; i < 5; i++) {
            const blockHash = ethers.keccak256(ethers.randomBytes(32));
            await blockSigner.connect(standbyNodes[0]).sign(i, blockHash);
            blockHashes.push(blockHash);
        }
    
        // Call calculateRewards for the current epoch
        await rewards.calculateRewards(1000, blockHashes, standbyNodes, 2);
    
        // Check if no transactions are added to the treasury
        const transactionCountBefore = await treasury.getTransactionCount();
        expect(transactionCountBefore).to.equal(0);
    
        // Confirm some more blocks by standby nodes for the next epoch
        const nextEpochBlockHashes = [];
        for (let i = 5; i < 10; i++) {
            const blockHash = ethers.keccak256(ethers.randomBytes(32));
            await blockSigner.connect(standbyNodes[0]).sign(i, blockHash);
            nextEpochBlockHashes.push(blockHash);
        }
    
        // Call calculateRewards for the next epoch
        await rewards.calculateRewards(1000, nextEpochBlockHashes, standbyNodes, 3);
    
        // Check if transactions are added to the treasury for the next epoch
        const transactionCountAfter = await treasury.getTransactionCount();
        expect(transactionCountAfter).to.be.above(0);
    });
    
  });

  it("Should handle slashed nodes correctly", async function () {

    await rewards.setRewardTransferEpoch(1); 

    // Confirm blocks by all standby nodes except the last one
    const blockHashes = [];
    const standbyNodes = addrs
    for (let i = 0; i < 1; i++) {
        const blockHash = ethers.keccak256(ethers.randomBytes(32));
        for (const node of standbyNodes.slice(0, -1)) {
            await blockSigner.connect(node).sign(i, blockHash);
        }
        blockHashes.push(blockHash);
    }

    let epoch = 2;

    // Call calculateRewards for the current epoch
    await rewards.calculateRewards(1000, blockHashes, standbyNodes, epoch);
    
    // Check if no transactions are added to the treasury for the last standby node
    const lastStandbyNode = addrs[addrs.length - 1];
    
    const transactionCountBefore = await treasury.getTransactionCountForAddress(lastStandbyNode.address);
    expect(transactionCountBefore).to.equal(0);
    
    let isSlashed = await rewards.mockIsSlashed(lastStandbyNode, epoch);
    expect(isSlashed).to.equal(true);
    
    epoch++;

    for (let step = 0; step < 5; step++) {
        // Confirm more blocks by all standby nodes including the last one
        const nextEpochBlockHashes = [];
        for (let i = 5+step*5; i < 5+step*5+4; i++) {
            const blockHash = ethers.keccak256(ethers.randomBytes(32));
            for (const node of addrs) {
                await blockSigner.connect(node).sign(i, blockHash);
            }
            nextEpochBlockHashes.push(blockHash);
        }
        
        // Call calculateRewards for the next epoch
        await rewards.calculateRewards(1000, nextEpochBlockHashes, addrs, epoch);
        isSlashed = await rewards.mockIsSlashed(lastStandbyNode, epoch);
        const transactionCountAfter = await treasury.getTransactionCountForAddress(lastStandbyNode);
        
        if (step < 4) {
            expect(isSlashed).to.equal(true);
            // Check if no transactions are added to the treasury for the last slashed standby node
            expect(transactionCountAfter).to.equal(0);
        }
        else {
            expect(isSlashed).to.equal(false);
            // Check if transactions are added to the treasury for the last slashed standby node
            expect(transactionCountAfter).to.be.above(0);
        }
        epoch++;
    }
  });

  it("Should allow only whitelisted addresses to call calculateRewards", async function () {
        // Confirm some blocks by signing them with the BlockSigner contract
        const blockHashes = [];
        const standbyNodes = addrs; // Assuming these are the standby nodes
        for (let i = 0; i < 5; i++) {
            const blockHash = ethers.keccak256(ethers.randomBytes(32));
            await blockSigner.connect(standbyNodes[0]).sign(i, blockHash); // Each address signs the same block
            blockHashes.push(blockHash);
        }

        const chainReward = 1000;
        const epoch = 2;

        // Ensure addr1 is not whitelisted
        await rewards.removeWhitelisted(addr1.address);

        // Expect revert when addr1 tries to call calculateRewards
        await expect(rewards.connect(addr1).calculateRewards(chainReward, blockHashes, standbyNodes, epoch)).to.be.revertedWith("Not whitelisted");
    });

    it("Should allow whitelisted addresses to call calculateRewards", async function () {
        // Confirm some blocks by signing them with the BlockSigner contract
        const blockHashes = [];
        const standbyNodes = addrs; // Assuming these are the standby nodes
        for (let i = 0; i < 5; i++) {
            const blockHash = ethers.keccak256(ethers.randomBytes(32));
            await blockSigner.connect(standbyNodes[0]).sign(i, blockHash); // Each address signs the same block
            blockHashes.push(blockHash);
        }

        const chainReward = 1000;
        const epoch = 2;

        // Add addr1 to the whitelist
        await rewards.addWhitelisted(addr1.address);

        // Expect success when addr1 (whitelisted) calls calculateRewards
        await rewards.connect(addr1).calculateRewards(chainReward, blockHashes, standbyNodes, epoch);
    });


});

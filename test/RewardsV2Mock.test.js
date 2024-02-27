const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RewardsV2 Contract", function () {
  let RewardsMock;
  let rewards;
  let rewardsV2;
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

    // Confirm some blocks
    const blockHashes = [];
    const standbyNodes = addrs
    for (let i = 0; i < 1; i++) {
        const blockHash = ethers.keccak256(ethers.randomBytes(32));
        for (const node of standbyNodes) {
            await blockSigner.connect(node).sign(i, blockHash);
        }
        blockHashes.push(blockHash);
    }

    let epoch = 2;

    // Call calculateRewards for the current epoch
    await rewards.calculateRewards(1000, blockHashes, standbyNodes, epoch);

    // Upgrade RewardsMock to RewardsV2Mock
    const RewardsV2 = await ethers.getContractFactory("RewardsV2Mock");
    rewardsV2 = await upgrades.upgradeProxy(await rewards.getAddress(), RewardsV2);
    await rewardsV2.waitForDeployment();

});

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await rewardsV2.owner()).to.equal(owner.address);
    });

    it("Should set the initial epoch", async function () {
      expect(await rewardsV2.currentEpoch()).to.equal(2);
    });
  });

  describe("Functions", function () {
    it("Pending rewards should remain after upgrade to RewardsV2Mock", async function () {
      // Check if pending rewards are still present after the upgrade
      const pendingRewardsAfterUpgrade = await rewardsV2.mockGetPendingRewardsTransaction(addrs[0]);
      expect(pendingRewardsAfterUpgrade).to.be.above(0);
    });

    it("calculateReward should always return 0", async function () {
      // Mocking necessary values for calculation
      const chainReward = 1000;
      const verifiedBlocks = 5;
      const slashed = false;

      await rewardsV2.mockSetStandbyNodeBlocksConfirmedHistory(20);

      const rewardsCalculated = await rewardsV2.mockCalculateReward(chainReward, verifiedBlocks, slashed);
      expect(rewardsCalculated).to.equal(0); // rewards should be 0
    });
  });

});

const { ethers } = require( "hardhat");
const { upgrades } = require( "hardhat");

async function main() {
  const Rewards = await ethers.getContractFactory("Rewards");
  console.log("Deploying Rewards...");
  const rewards = await upgrades.deployProxy(Rewards, ['0x', '0x', 1, 1], { initializer: 'initialize' });
  await rewards.waitForDeployment();
  const address = await rewards.getAddress();
  console.log(address," rewards (proxy) address");
  console.log(await upgrades.erc1967.getImplementationAddress(address), "get Implementation Address");
  console.log(await upgrades.erc1967.getAdminAddress(address), "getAdminAddress");
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
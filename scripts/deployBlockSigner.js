const { ethers } = require( "hardhat");
const { upgrades } = require( "hardhat");

async function main() {
  const BlockSigner = await ethers.getContractFactory("BlockSigner");
  console.log("Deploying BlockSigner...");
  const blockSigner = await BlockSigner.deploy(1);
  await blockSigner.waitForDeployment();
  const address = await blockSigner.getAddress();
  console.log(address," BlockSigner address");
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
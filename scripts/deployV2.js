// scripts/deployV2.js
const {ethers } = require( "hardhat");
const { upgrades } = require( "hardhat");

const proxyAddress = '0x8968E3deA3719aeE95195b6e0bF92d5Baf2c0A50';
async function main() {
    console.log(proxyAddress," original Rewards(proxy) address");
    const RewardsV2 = await ethers.getContractFactory("RewardsV2");
    console.log("upgrade to RewardsV2...");
    const rewardsV2 = await upgrades.upgradeProxy(proxyAddress, RewardsV2);
    await rewardsV2.waitForDeployment();
    console.log(rewardsV2.address," RewardsV2 address(should be the same)");
    console.log(await upgrades.erc1967.getImplementationAddress(proxyAddress),"getImplementationAddress");
    console.log(await upgrades.erc1967.getAdminAddress(proxyAddress), "getAdminAddress");
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
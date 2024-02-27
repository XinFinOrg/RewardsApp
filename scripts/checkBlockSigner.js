const { ethers } = require("hardhat");

// Check if the address is a contract
async function isContract(address) {
    const code = await ethers.provider.getCode(address);
    return code !== "0x"; // If the code is not empty, it's a contract
}

// Usage
async function checkAddressType(addressToCheck) {
    const isContractAddress = await isContract(addressToCheck);
    if (isContractAddress) {
        console.log(`${addressToCheck} is a contract address.`);
    } else {
        console.log(`${addressToCheck} is a wallet address.`);
    }
}

async function main() {
    const address = '0x0000000000000000000000000000000000000089';
    await checkAddressType(address);
    
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
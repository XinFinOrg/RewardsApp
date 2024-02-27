require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.4.21",
      },
      {
        version: "0.8.1",
      },
    ],
  },

  networks: {
    xdc: {
      url: 'https://rpc.xdcrpc.com',
      accounts: [
        '0x653347a65b0136b12f149d9984d7e291585eed87580eac502a3ab5874a551274',
        '0xdd0ebd6ddaf6a848c29f67c87390b8a689754a57ee6b0b7ef8be3dd7e9b0544b',
        '0x01f9d501185ecc8122ae2dbb73cb68e2192d6ab8691934df23dad77cd18fb10b',
        '0x42c3f9302dddaed7f5c2ffcb6d40cf6ccd4e2baa988944a97f5b022f67187c44',
        '0x1a6336512c1003bf6b014e39af593af600ccaa7fd5666621eb1fc07514e31010',
        '0x541c3789b4a83ff470001e1b7dfc560cbfe36cae719fcf962ec88137dddecd89',
        '0xc9d8f3e1f0aeb7911922e12a8adcda77eb77dfb1fda4ad63d3da6ad778f03499',
        '0xcb5e896cd83f01cb816bbba431ba32bed9e4d0bf21202dd92fc38f6935915f0d',
        '0x4ae551f33ef909deaf7d7ce04ff4fcc245a9774f1a2a20f0bbbbf55d48b79ec9',
        '0xdd57fe58a64fc9f2ea70073914f537782e417d88329122a77bdca2fd69b18068',
        '0x700b5414268b9cd342fdc85cad93144866f9e1cf1357ab187375be5bc904f003'
      ]
    }
  }
};

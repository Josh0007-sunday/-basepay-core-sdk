"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRPCUrl = getRPCUrl;
exports.getTokenAddress = getTokenAddress;
const ethers_1 = require("ethers");
function getRPCUrl(network) {
    return network === "base"
        ? "https://mainnet.base.org"
        : "https://sepolia.base.org";
}
function getTokenAddress(token, network) {
    const tokenAddresses = {
        "base": {
            "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        },
        "base-sepolia": {
            "USDC": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
        }
    };
    return token === "ETH"
        ? ethers_1.ethers.ZeroAddress
        : tokenAddresses[network][token];
}

import { ethers } from "ethers";

export function getRPCUrl(network: "base" | "base-sepolia"): string {
  return network === "base" 
    ? "https://mainnet.base.org" 
    : "https://sepolia.base.org";
}

export function getTokenAddress(token: "ETH" | "USDC", network: "base" | "base-sepolia"): string {
  const tokenAddresses = {
    "base": {
      "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    },
    "base-sepolia": {
      "USDC": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    }
  };

  return token === "ETH" 
    ? ethers.ZeroAddress 
    : tokenAddresses[network][token];
}
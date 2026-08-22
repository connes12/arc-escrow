import { isAddress } from "viem";

const configuredAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const configuredNftAddress = process.env.NEXT_PUBLIC_PRODUCT_NFT_ADDRESS;
const configuredProductEscrowAddress = process.env.NEXT_PUBLIC_PRODUCT_ESCROW_ADDRESS;

export const escrowContractAddress =
  configuredAddress && isAddress(configuredAddress) ? configuredAddress : undefined;

export const productNftContractAddress =
  configuredNftAddress && isAddress(configuredNftAddress) ? configuredNftAddress : undefined;

export const productEscrowContractAddress =
  configuredProductEscrowAddress && isAddress(configuredProductEscrowAddress) ? configuredProductEscrowAddress : undefined;

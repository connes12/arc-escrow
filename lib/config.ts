import { isAddress } from "viem";

const configuredAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export const escrowContractAddress =
  configuredAddress && isAddress(configuredAddress) ? configuredAddress : undefined;
import { createConfig, http } from "wagmi";
import { injected } from "@wagmi/core";
import { arcTestnet } from "@/lib/arcChain";

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [arcTestnet.id]: http(arcTestnet.rpcUrls.default.http[0]),
  },
});
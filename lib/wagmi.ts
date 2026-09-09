import { createConfig, http } from "wagmi";
import { injected } from "@wagmi/core";
import { arcTestnet } from "@/lib/arcChain";

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected({ target: "metaMask", shimDisconnect: true }),
    injected({ target: "rabby", shimDisconnect: true }),
    injected({ target: "okxWallet", shimDisconnect: true }),
    injected({ target: "coinbaseWallet", shimDisconnect: true }),
    injected({ target: "trust", shimDisconnect: true }),
  ],
  transports: {
    [arcTestnet.id]: http(arcTestnet.rpcUrls.default.http[0]),
  },
});

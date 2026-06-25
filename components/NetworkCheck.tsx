"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arcChain";

export function NetworkCheck() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending } = useSwitchChain();
  const [message, setMessage] = useState<string>("Connect your wallet to verify Arc Testnet.");

  useEffect(() => {
    if (!isConnected) {
      setMessage("Connect your wallet to verify Arc Testnet.");
      return;
    }

    if (chainId === ARC_TESTNET_CHAIN_ID) {
      setMessage("Wallet is on Arc Testnet.");
      return;
    }

    setMessage("Wallet is on the wrong network. Switch to Arc Testnet.");
  }, [chainId, isConnected]);

  const needsSwitch = isConnected && chainId !== ARC_TESTNET_CHAIN_ID;

  return (
    <section style={cardStyle}>
      <h2>Network</h2>
      <p>{message}</p>
      {needsSwitch ? (
        <button
          style={buttonStyle}
          disabled={isPending}
          onClick={async () => {
            try {
              await switchChainAsync({ chainId: ARC_TESTNET_CHAIN_ID });
            } catch {
              setMessage("Network switch was rejected or failed.");
            }
          }}
        >
          {isPending ? "Switching..." : "Switch to Arc Testnet"}
        </button>
      ) : null}
    </section>
  );
}

const cardStyle = {
  background: "#131a2d",
  border: "1px solid #26314e",
  borderRadius: 16,
  padding: 20,
} satisfies React.CSSProperties;

const buttonStyle = {
  border: 0,
  borderRadius: 10,
  padding: "10px 16px",
  background: "#22c55e",
  color: "white",
  cursor: "pointer",
} satisfies React.CSSProperties;
"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arcChain";

export function NetworkCheck() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending } = useSwitchChain();
  const [message, setMessage] = useState<string>("Connect your wallet to verify Arc Testnet.");
  const [btnBg, setBtnBg] = useState("#123C2D");

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
      <h2 style={headingStyle}>Network</h2>
      <p style={textStyle}>{message}</p>
      {needsSwitch ? (
        <button
          style={{ ...buttonStyle, background: btnBg }}
          disabled={isPending}
          onMouseEnter={() => setBtnBg("#0B2A20")}
          onMouseLeave={() => setBtnBg("#123C2D")}
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
  background: "#ffffff",
  border: "1px solid #DCE8DF",
  borderRadius: 16,
  padding: 20,
  transition: "all 0.2s ease-in-out",
} satisfies React.CSSProperties;

const headingStyle = {
  color: "#123C2D",
  fontSize: 22,
  fontWeight: 600,
  marginBottom: 16,
} satisfies React.CSSProperties;

const textStyle = {
  color: "#18201C",
  fontSize: 15,
  lineHeight: 1.5,
  marginBottom: 12,
} satisfies React.CSSProperties;

const buttonStyle = {
  border: 0,
  borderRadius: 10,
  padding: "10px 18px",
  color: "#F6F1E7",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: 14,
  transition: "background 0.2s",
} satisfies React.CSSProperties;

"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletConnect() {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const injectedConnector = connectors[0];
  const showConnectedState = isMounted && isConnected;

  return (
    <section style={cardStyle}>
      <h2>Wallet</h2>
      {showConnectedState ? (
        <div style={rowStyle}>
          <span>Connected: {address}</span>
          <button style={buttonStyle} onClick={() => disconnect()}>
            Disconnect
          </button>
        </div>
      ) : (
        <button
          style={buttonStyle}
          disabled={!isMounted || !injectedConnector || isPending}
          onClick={() => injectedConnector && connect({ connector: injectedConnector })}
        >
          {!isMounted ? "Loading wallet..." : isPending ? "Connecting..." : "Connect MetaMask"}
        </button>
      )}
    </section>
  );
}

const cardStyle = {
  background: "#131a2d",
  border: "1px solid #26314e",
  borderRadius: 16,
  padding: 20,
} satisfies React.CSSProperties;

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
} satisfies React.CSSProperties;

const buttonStyle = {
  border: 0,
  borderRadius: 10,
  padding: "10px 16px",
  background: "#4f7cff",
  color: "white",
  cursor: "pointer",
} satisfies React.CSSProperties;
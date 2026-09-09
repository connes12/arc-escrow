"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { USDC_ADDRESS, usdcAbi } from "@/lib/arcChain";

export function UsdcBalance() {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const gasBalance = useBalance({ address, query: { enabled: Boolean(address) } });
  const tokenBalance = useReadContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showBalances = isMounted && isConnected;
  const nativeFormatted = gasBalance.data
    ? formatUnits(gasBalance.data.value, gasBalance.data.decimals)
    : "0";

  return (
    <section style={cardStyle}>
      <h2 style={headingStyle}>USDC Balances</h2>
      {!showBalances ? (
        <p style={textStyle}>Connect your wallet to view balances.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <p style={textStyle}>
            Native gas USDC (18 decimals):{" "}
            <strong style={{ color: "#123C2D" }}>
              {nativeFormatted} {gasBalance.data?.symbol ?? "USDC"}
            </strong>
          </p>
          <p style={textStyle}>
            ERC-20 USDC (6 decimals):{" "}
            <strong style={{ color: "#123C2D" }}>
              {tokenBalance.data ? formatUnits(tokenBalance.data, 6) : "0"} USDC
            </strong>
          </p>
        </div>
      )}
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
  margin: 0,
  lineHeight: 1.5,
} satisfies React.CSSProperties;

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
      <h2>USDC Balances</h2>
      {!showBalances ? (
        <p>Connect your wallet to view balances.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <p>
            Native gas USDC (18 decimals): {nativeFormatted}{" "}
            {gasBalance.data?.symbol ?? "USDC"}
          </p>
          <p>
            ERC-20 USDC (6 decimals): {tokenBalance.data ? formatUnits(tokenBalance.data, 6) : "0"} USDC
          </p>
        </div>
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
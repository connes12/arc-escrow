"use client";

import { useEffect, useState, useCallback } from "react";
import { formatUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { escrowContractAddress } from "@/lib/config";
import { ESCROW_ABI } from "@/lib/escrowAbi";

interface EscrowItem {
  escrowId: string;
  seller: string;
  amount: bigint;
  status: number; // 1: Funded, 2: Released, 3: Refunded
}

interface MyEscrowsProps {
  onSelectEscrowId: (id: string) => void;
}

export function MyEscrows({ onSelectEscrowId }: MyEscrowsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [escrows, setEscrows] = useState<EscrowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("Connect your wallet to see your escrows.");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchMyEscrows = useCallback(async () => {
    if (!isConnected || !address || !publicClient) {
      setEscrows([]);
      setStatusText("Connect your wallet to see your escrows.");
      return;
    }

    if (!escrowContractAddress) {
      setStatusText("Escrow contract address is not configured. Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`.");
      return;
    }

    setLoading(true);
    setStatusText("Loading your escrows from storage...");

    try {
      let uniqueEscrowIds: bigint[] = [];
      if (typeof window !== "undefined") {
        try {
          const storageKey = `myEscrowIds_${address.toLowerCase()}`;
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              uniqueEscrowIds = parsed.map((id) => BigInt(id));
            }
          }
        } catch (e) {
          console.error("Failed to parse stored escrow IDs", e);
        }
      }

      const items: EscrowItem[] = [];

      for (const escrowId of uniqueEscrowIds) {
        try {
          const rawEscrow = await publicClient.readContract({
            address: escrowContractAddress,
            abi: ESCROW_ABI,
            functionName: "getEscrow",
            args: [escrowId],
          }) as any;

          if (rawEscrow) {
            const seller = rawEscrow.seller || rawEscrow[1];
            const amount = rawEscrow.amount !== undefined ? rawEscrow.amount : rawEscrow[2];
            const statusVal = rawEscrow.status !== undefined ? rawEscrow.status : rawEscrow[3];

            items.push({
              escrowId: escrowId.toString(),
              seller: seller,
              amount: BigInt(amount),
              status: Number(statusVal),
            });
          }
        } catch (err) {
          console.error(`Error querying escrow ID ${escrowId}:`, err);
        }
      }

      // Sort escrows with newest first (higher ID first)
      items.sort((a, b) => Number(b.escrowId) - Number(a.escrowId));

      setEscrows(items);
      if (items.length === 0) {
        setStatusText("You have not created any escrows yet.");
      } else {
        setStatusText(`Successfully loaded ${items.length} escrow(s).`);
      }
    } catch (error) {
      console.error("Error fetching my escrows:", error);
      setStatusText("Failed to fetch escrows from the network.");
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, publicClient]);

  useEffect(() => {
    fetchMyEscrows();
  }, [fetchMyEscrows]);

  if (!isMounted || !isConnected) {
    return null;
  }

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return { text: "Funded", style: statusFundedStyle };
      case 2:
        return { text: "Released", style: statusReleasedStyle };
      case 3:
        return { text: "Refunded", style: statusRefundedStyle };
      default:
        return { text: "Unknown", style: statusUnknownStyle };
    }
  };

  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <h2>My Escrows</h2>
        <button style={refreshButtonStyle} disabled={loading} onClick={fetchMyEscrows}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <p style={{ color: "#b8c0d0", marginBottom: 16 }}>{statusText}</p>

      {escrows.length > 0 ? (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Seller</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {escrows.map((escrow) => {
                const labelInfo = getStatusLabel(escrow.status);
                return (
                  <tr key={escrow.escrowId} style={trStyle}>
                    <td style={tdStyle}>#{escrow.escrowId}</td>
                    <td style={tdStyle} title={escrow.seller}>
                      {escrow.seller.slice(0, 6)}...{escrow.seller.slice(-4)}
                    </td>
                    <td style={tdStyle}>{formatUnits(escrow.amount, 6)} USDC</td>
                    <td style={tdStyle}>
                      <span style={labelInfo.style}>{labelInfo.text}</span>
                    </td>
                    <td style={tdStyle}>
                      {escrow.status === 1 ? (
                        <button
                          style={actionButtonStyle}
                          onClick={() => onSelectEscrowId(escrow.escrowId)}
                        >
                          Release
                        </button>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: 13 }}>None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
} satisfies React.CSSProperties;

const refreshButtonStyle = {
  border: "1px solid #3b82f6",
  borderRadius: 10,
  padding: "8px 14px",
  background: "transparent",
  color: "#3b82f6",
  cursor: "pointer",
  fontSize: 14,
} satisfies React.CSSProperties;

const tableContainerStyle = {
  overflowX: "auto",
} satisfies React.CSSProperties;

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
} satisfies React.CSSProperties;

const thStyle = {
  borderBottom: "2px solid #26314e",
  padding: "10px 8px",
  color: "#94a3b8",
  fontSize: 14,
  fontWeight: "600",
} satisfies React.CSSProperties;

const trStyle = {
  borderBottom: "1px solid #1e293b",
} satisfies React.CSSProperties;

const tdStyle = {
  padding: "12px 8px",
  fontSize: 14,
  color: "#f1f5f9",
} satisfies React.CSSProperties;

const statusFundedStyle = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 6,
  background: "rgba(34, 197, 94, 0.15)",
  color: "#4ade80",
  fontSize: 12,
  fontWeight: "600",
} satisfies React.CSSProperties;

const statusReleasedStyle = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 6,
  background: "rgba(148, 163, 184, 0.15)",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: "600",
} satisfies React.CSSProperties;

const statusRefundedStyle = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 6,
  background: "rgba(249, 115, 22, 0.15)",
  color: "#fb923c",
  fontSize: 12,
  fontWeight: "600",
} satisfies React.CSSProperties;

const statusUnknownStyle = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 6,
  background: "rgba(100, 116, 139, 0.15)",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: "600",
} satisfies React.CSSProperties;

const actionButtonStyle = {
  border: 0,
  borderRadius: 6,
  padding: "6px 12px",
  background: "#f97316",
  color: "white",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: "600",
} satisfies React.CSSProperties;

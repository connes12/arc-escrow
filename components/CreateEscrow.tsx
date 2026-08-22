"use client";

import { FormEvent, useMemo, useState } from "react";
import { isAddress, parseEventLogs, parseUnits } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { USDC_ADDRESS, explorerUrl, usdcAbi } from "@/lib/arcChain";
import { escrowContractAddress } from "@/lib/config";
import { ESCROW_ABI } from "@/lib/escrowAbi";

export function CreateEscrow() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [approveHash, setApproveHash] = useState<string>();
  const [createHash, setCreateHash] = useState<string>();
  const [createdEscrowId, setCreatedEscrowId] = useState<string>();
  const [status, setStatus] = useState<React.ReactNode>("Approve USDC, then lock it into escrow.");
  const [busyAction, setBusyAction] = useState<"approve" | "create" | null>(null);

  const parsedAmount = useMemo(() => {
    try {
      return amount ? parseUnits(amount, 6) : undefined;
    } catch {
      return undefined;
    }
  }, [amount]);

  const canSubmit =
    Boolean(escrowContractAddress) && isConnected && isAddress(seller) && Boolean(parsedAmount);

  async function approveUsdc(event: FormEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!escrowContractAddress || !publicClient || !parsedAmount || !isAddress(seller)) {
      setStatus("Enter a valid seller address, amount, and contract address first.");
      return;
    }

    setBusyAction("approve");
    setCreateHash(undefined);
    setCreatedEscrowId(undefined);

    try {
      setStatus("Waiting for USDC approval wallet confirmation...");
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: usdcAbi,
        functionName: "approve",
        args: [escrowContractAddress, parsedAmount],
      });

      setApproveHash(hash);
      setStatus("Approval sent. Waiting for confirmation...");
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(
        <span>
          ✅ Transaction successful —{" "}
          <a
            href={explorerUrl(hash)}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "underline", color: "#60a5fa" }}
          >
            view on Arcscan
          </a>
        </span>
      );
    } catch (error) {
      const reason = error instanceof Error ? (error as any).shortMessage || error.message : String(error);
      setStatus(`❌ Transaction failed: ${reason}`);
    } finally {
      setBusyAction(null);
    }
  }

  async function createEscrow(event: FormEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!escrowContractAddress || !publicClient || !parsedAmount || !isAddress(seller)) {
      setStatus("Enter a valid seller address, amount, and contract address first.");
      return;
    }

    setBusyAction("create");
    setCreatedEscrowId(undefined);

    try {
      setStatus("Waiting for escrow creation wallet confirmation...");
      const hash = await writeContractAsync({
        address: escrowContractAddress,
        abi: ESCROW_ABI,
        functionName: "createEscrow",
        args: [seller, parsedAmount],
      });

      setCreateHash(hash);
      setStatus("Escrow transaction sent. Waiting for confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const [createdEvent] = parseEventLogs({
        abi: ESCROW_ABI,
        eventName: "EscrowCreated",
        logs: receipt.logs,
      });

      if (createdEvent) {
        const escrowId = createdEvent.args.escrowId?.toString();
        setCreatedEscrowId(escrowId);

        if (escrowId && address && typeof window !== "undefined") {
          try {
            const storageKey = `myEscrowIds_${address.toLowerCase()}`;
            const stored = localStorage.getItem(storageKey);
            let savedIds: string[] = [];
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                savedIds = parsed;
              }
            }
            if (!savedIds.includes(escrowId)) {
              savedIds.push(escrowId);
              localStorage.setItem(storageKey, JSON.stringify(savedIds));
            }
          } catch (e) {
            console.error("Failed to save escrowId to localStorage", e);
          }
        }

        setStatus(
          <span>
            ✅ Transaction successful —{" "}
            <a
              href={explorerUrl(hash)}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "underline", color: "#60a5fa" }}
            >
              view on Arcscan
            </a>{" "}
            (Escrow ID: {escrowId})
          </span>
        );
      } else {
        setStatus(
          <span>
            ✅ Transaction successful —{" "}
            <a
              href={explorerUrl(hash)}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "underline", color: "#60a5fa" }}
            >
              view on Arcscan
            </a>
          </span>
        );
      }
    } catch (error) {
      const reason = error instanceof Error ? (error as any).shortMessage || error.message : String(error);
      setStatus(`❌ Transaction failed: ${reason}`);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section style={cardStyle}>
      <h2>Create Escrow</h2>
      <form style={formStyle}>
        <label style={labelStyle}>
          Seller address
          <input style={inputStyle} value={seller} onChange={(event) => setSeller(event.target.value)} />
        </label>
        <label style={labelStyle}>
          Amount in ERC-20 USDC (6 decimals)
          <input style={inputStyle} value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <div style={buttonRowStyle}>
          <button style={buttonStyle} disabled={!canSubmit || busyAction !== null} onClick={approveUsdc}>
            {busyAction === "approve" ? "Processing..." : "Approve USDC"}
          </button>
          <button style={buttonStyle} disabled={!canSubmit || busyAction !== null} onClick={createEscrow}>
            {busyAction === "create" ? "Processing..." : "Lock USDC"}
          </button>
        </div>
      </form>
      {!escrowContractAddress ? (
        <p>
          Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`.
        </p>
      ) : null}
      <p>{status}</p>
      {approveHash ? (
        <p>
          Approval tx: <a href={explorerUrl(approveHash)} target="_blank" rel="noreferrer">{approveHash}</a>
        </p>
      ) : null}
      {createHash ? (
        <p>
          Escrow tx: <a href={explorerUrl(createHash)} target="_blank" rel="noreferrer">{createHash}</a>
        </p>
      ) : null}
      {createdEscrowId ? (
        <div style={successBoxStyle}>
          <strong>Escrow ID:</strong> {createdEscrowId}
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

const formStyle = {
  display: "grid",
  gap: 12,
} satisfies React.CSSProperties;

const labelStyle = {
  display: "grid",
  gap: 8,
} satisfies React.CSSProperties;

const inputStyle = {
  border: "1px solid #334155",
  borderRadius: 10,
  padding: "10px 12px",
  background: "#0f172a",
  color: "#f8fafc",
} satisfies React.CSSProperties;

const buttonRowStyle = {
  display: "flex",
  gap: 12,
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

const successBoxStyle = {
  marginTop: 12,
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #22c55e",
  background: "rgba(34, 197, 94, 0.12)",
  color: "#dcfce7",
} satisfies React.CSSProperties;

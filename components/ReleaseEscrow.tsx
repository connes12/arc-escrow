"use client";

import { FormEvent, useState } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import { explorerUrl } from "@/lib/arcChain";
import { escrowContractAddress } from "@/lib/config";
import { ESCROW_ABI } from "@/lib/escrowAbi";

interface ReleaseEscrowProps {
  escrowId: string;
  setEscrowId: (id: string) => void;
}

export function ReleaseEscrow({ escrowId, setEscrowId }: ReleaseEscrowProps) {
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<React.ReactNode>("Release a funded escrow as the buyer.");
  const [txHash, setTxHash] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!escrowContractAddress || !publicClient || escrowId.trim() === "") {
      setStatus("Set the contract address and enter an escrow ID.");
      return;
    }

    setBusy(true);

    try {
      setStatus("Waiting for release wallet confirmation...");
      const hash = await writeContractAsync({
        address: escrowContractAddress,
        abi: ESCROW_ABI,
        functionName: "releaseEscrow",
        args: [BigInt(escrowId)],
      });

      setTxHash(hash);
      setStatus("Release transaction sent. Waiting for confirmation...");
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
      setBusy(false);
    }
  }

  return (
    <section style={cardStyle}>
      <h2>Release Escrow</h2>
      <form style={formStyle} onSubmit={onSubmit}>
        <label style={labelStyle}>
          Escrow ID
          <input style={inputStyle} value={escrowId} onChange={(event) => setEscrowId(event.target.value)} />
        </label>
        <button style={buttonStyle} disabled={busy || !escrowContractAddress} type="submit">
          {busy ? "Processing..." : "Release escrow"}
        </button>
      </form>
      {!escrowContractAddress ? <p>Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`.</p> : null}
      <p>{status}</p>
      {txHash ? (
        <p>
          Release tx: <a href={explorerUrl(txHash)} target="_blank" rel="noreferrer">{txHash}</a>
        </p>
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

const buttonStyle = {
  border: 0,
  borderRadius: 10,
  padding: "10px 16px",
  background: "#f97316",
  color: "white",
  cursor: "pointer",
} satisfies React.CSSProperties;

"use client";
import { FormEvent, useState, useEffect } from "react";
import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";
import { formatUnits } from "viem";
import { explorerUrl, ARC_TESTNET_CHAIN_ID } from "@/lib/arcChain";
import { escrowContractAddress } from "@/lib/config";
import { ESCROW_ABI } from "@/lib/escrowAbi";
import { useToast, parseTxError } from "./Toast";

interface ReleaseEscrowProps {
  escrowId: string;
  setEscrowId: (id: string) => void;
}

export function ReleaseEscrow({ escrowId, setEscrowId }: ReleaseEscrowProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { showToast } = useToast();

  const [status, setStatus] = useState<React.ReactNode>("Release a funded escrow as the buyer.");
  const [busy, setBusy] = useState(false);
  const [releaseGasFee, setReleaseGasFee] = useState<string | null>(null);

  const isWrongNetwork = isConnected && chainId !== ARC_TESTNET_CHAIN_ID;
  const canSubmit = Boolean(escrowContractAddress) && escrowId.trim() !== "" && !isWrongNetwork;

  // Synchronize status with wrong network warnings
  useEffect(() => {
    if (isConnected && isWrongNetwork) {
      setStatus("⚠️ Wallet is on the wrong network. Please switch to Arc Testnet to transact.");
    } else {
      setStatus("Release a funded escrow as the buyer.");
    }
  }, [chainId, isConnected, isWrongNetwork]);

  // Estimate gas for Release transaction
  useEffect(() => {
    async function estimateRelease() {
      if (!publicClient || !address || !canSubmit || isWrongNetwork || !escrowId.trim()) {
        setReleaseGasFee(null);
        return;
      }
      try {
        const idBigInt = BigInt(escrowId);
        const gasLimit = await publicClient.estimateContractGas({
          address: escrowContractAddress as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: "releaseEscrow",
          args: [idBigInt],
          account: address,
        });
        const gasPrice = await publicClient.getGasPrice();
        const fee = gasLimit * gasPrice;
        const symbol = publicClient.chain?.nativeCurrency?.symbol || "USDC";
        setReleaseGasFee(`~${parseFloat(formatUnits(fee, 18)).toFixed(6)} ${symbol}`);
      } catch (err) {
        console.error("Release gas estimate failed:", err);
        setReleaseGasFee(null);
      }
    }
    estimateRelease();
  }, [publicClient, address, escrowId, canSubmit, isWrongNetwork]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!escrowContractAddress || !publicClient || escrowId.trim() === "" || isWrongNetwork) return;
    setBusy(true);
    try {
      setStatus("Confirming release in wallet...");
      const hash = await writeContractAsync({
        address: escrowContractAddress,
        abi: ESCROW_ABI,
        functionName: "releaseEscrow",
        args: [BigInt(escrowId)],
      });
      setStatus("Release sent. Confirming on-chain...");
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(
        <span>
          ✅ Released successfully —{" "}
          <a href={explorerUrl(hash)} target="_blank" rel="noreferrer" className="underline font-bold text-[#123C2D]">
            view tx
          </a>
        </span>
      );
      showToast("success", `Escrow #${escrowId} released successfully!`);
    } catch (error: any) {
      const parsedError = parseTxError(error);
      setStatus(<span className="text-[#A63A2B] font-semibold">❌ Failed: {parsedError}</span>);
      showToast("error", parsedError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-[#E8EDE0] border border-[#DCE8DF] rounded-2xl p-5 text-left transition-all">
      <h2 className="text-[#123C2D] text-xl font-bold mb-4">Release Escrow</h2>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-1.5 text-sm font-semibold text-[#123C2D]">
          Escrow ID
          <input
            className="border border-[#DCE8DF] rounded-lg p-3 bg-white text-[#18201C] outline-none transition focus:border-[#123C2D] disabled:opacity-60 disabled:cursor-not-allowed"
            value={escrowId}
            onChange={(event) => setEscrowId(event.target.value)}
            placeholder="e.g. 1"
            disabled={isWrongNetwork}
          />
        </label>
        <div className="flex flex-col gap-1.5 w-fit">
          <button
            className={`font-semibold text-sm rounded-lg px-5 py-3 transition cursor-pointer w-fit ${
              !canSubmit || busy
                ? "bg-[#B8B8B0] text-[#18201C] opacity-50 cursor-not-allowed"
                : "bg-[#123C2D] hover:bg-[#0B2A20] text-[#F6F1E7]"
            }`}
            disabled={!canSubmit || busy}
            type="submit"
          >
            {busy ? "Processing..." : "Release Escrow"}
          </button>
          {releaseGasFee && (
            <span className="text-[11px] text-[#18201C]/70 ml-1 font-medium animate-fadeIn">Est. fee: {releaseGasFee}</span>
          )}
        </div>
      </form>
      {!escrowContractAddress && (
        <p className="text-[#A63A2B] text-xs mt-3 font-semibold">
          Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`.
        </p>
      )}
      <p className="text-xs text-[#18201C] mt-3 leading-relaxed">{status}</p>
    </section>
  );
}
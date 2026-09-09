"use client";
import { useMemo, useState, useEffect } from "react";
import { isAddress, parseEventLogs, parseUnits, formatUnits } from "viem";
import { useAccount, usePublicClient, useWriteContract, useChainId } from "wagmi";
import { USDC_ADDRESS, explorerUrl, usdcAbi, ARC_TESTNET_CHAIN_ID } from "@/lib/arcChain";
import { escrowContractAddress } from "@/lib/config";
import { ESCROW_ABI } from "@/lib/escrowAbi";
import { useToast, parseTxError } from "./Toast";

export function CreateEscrow({ onLockSuccess }: { onLockSuccess?: (id: string) => void }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { showToast } = useToast();
  
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [status, setStatus] = useState<React.ReactNode>("Approve USDC, then lock it into escrow.");
  const [busy, setBusy] = useState<"approve" | "create" | null>(null);

  const [approveGasFee, setApproveGasFee] = useState<string | null>(null);
  const [lockGasFee, setLockGasFee] = useState<string | null>(null);

  const isWrongNetwork = isConnected && chainId !== ARC_TESTNET_CHAIN_ID;

  const parsedAmount = useMemo(() => {
    try { return amount ? parseUnits(amount, 6) : undefined; } catch { return undefined; }
  }, [amount]);

  const canSubmit = Boolean(escrowContractAddress) && isConnected && !isWrongNetwork && isAddress(seller) && Boolean(parsedAmount);

  // Synchronize wrong network status
  useEffect(() => {
    if (isConnected && isWrongNetwork) {
      setStatus("⚠️ Wallet is on the wrong network. Please switch to Arc Testnet to transact.");
    } else {
      setStatus("Approve USDC, then lock it into escrow.");
    }
  }, [chainId, isConnected, isWrongNetwork]);

  // Estimate Gas for Approve USDC
  useEffect(() => {
    async function estimateApprove() {
      if (!publicClient || !address || !canSubmit || isApproved || isWrongNetwork || !parsedAmount) {
        setApproveGasFee(null);
        return;
      }
      try {
        const gasLimit = await publicClient.estimateContractGas({
          address: USDC_ADDRESS,
          abi: usdcAbi,
          functionName: "approve",
          args: [escrowContractAddress as `0x${string}`, parsedAmount],
          account: address,
        });
        const gasPrice = await publicClient.getGasPrice();
        const fee = gasLimit * gasPrice;
        const symbol = publicClient.chain?.nativeCurrency?.symbol || "USDC";
        setApproveGasFee(`~${parseFloat(formatUnits(fee, 18)).toFixed(6)} ${symbol}`);
      } catch (err) {
        console.error("Approve gas estimate failed:", err);
        setApproveGasFee(null);
      }
    }
    estimateApprove();
  }, [publicClient, address, seller, amount, isApproved, canSubmit, isWrongNetwork, parsedAmount]);

  // Estimate Gas for Lock USDC
  useEffect(() => {
    async function estimateLock() {
      if (!publicClient || !address || !canSubmit || !isApproved || isWrongNetwork || !parsedAmount) {
        setLockGasFee(null);
        return;
      }
      try {
        const gasLimit = await publicClient.estimateContractGas({
          address: escrowContractAddress as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: "createEscrow",
          args: [seller as `0x${string}`, parsedAmount],
          account: address,
        });
        const gasPrice = await publicClient.getGasPrice();
        const fee = gasLimit * gasPrice;
        const symbol = publicClient.chain?.nativeCurrency?.symbol || "USDC";
        setLockGasFee(`~${parseFloat(formatUnits(fee, 18)).toFixed(6)} ${symbol}`);
      } catch (err) {
        console.error("Lock gas estimate failed:", err);
        setLockGasFee(null);
      }
    }
    estimateLock();
  }, [publicClient, address, seller, amount, isApproved, canSubmit, isWrongNetwork, parsedAmount]);

  async function approveUsdc(e: any) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy("approve");
    try {
      setStatus("Confirming approval...");
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: usdcAbi,
        functionName: "approve",
        args: [escrowContractAddress as `0x${string}`, parsedAmount!],
      });
      setStatus("Confirming on-chain...");
      await publicClient!.waitForTransactionReceipt({ hash });
      setIsApproved(true);
      setStatus(<span>✅ Approved — <a href={explorerUrl(hash)} target="_blank" rel="noreferrer" className="underline font-bold text-[#123C2D]">view tx</a></span>);
      showToast("success", "USDC approved successfully!");
    } catch (err: any) {
      const parsedError = parseTxError(err);
      setStatus(<span className="text-[#A63A2B] font-semibold">❌ Failed: {parsedError}</span>);
      showToast("error", parsedError);
    } finally { setBusy(null); }
  }

  async function createEscrow(e: any) {
    e.preventDefault();
    if (!canSubmit || !isApproved || busy) return;
    setBusy("create");
    try {
      setStatus("Confirming creation...");
      const hash = await writeContractAsync({
        address: escrowContractAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "createEscrow",
        args: [seller as `0x${string}`, parsedAmount!],
      });
      setStatus("Confirming on-chain...");
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      const [ev] = parseEventLogs({ abi: ESCROW_ABI, eventName: "EscrowCreated", logs: receipt.logs });
      if (ev) {
        const escrowId = ev.args.escrowId?.toString();
        if (escrowId && address) {
          const key = `myEscrowIds_${address.toLowerCase()}`;
          const stored = localStorage.getItem(key);
          let saved = stored ? JSON.parse(stored) : [];
          if (!Array.isArray(saved)) saved = [];
          if (!saved.includes(escrowId)) {
            saved.push(escrowId);
            localStorage.setItem(key, JSON.stringify(saved));
          }
          if (onLockSuccess) onLockSuccess(escrowId);
        }
        setStatus(<span>✅ Created — <a href={explorerUrl(hash)} target="_blank" rel="noreferrer" className="underline font-bold text-[#123C2D]">view tx</a> (ID: #{escrowId})</span>);
        showToast("success", `Lock succeeded! Escrow ID: #${escrowId}`);
      } else {
        setStatus("✅ Created, log not found.");
        showToast("success", "Lock succeeded!");
      }
    } catch (err: any) {
      const parsedError = parseTxError(err);
      setStatus(<span className="text-[#A63A2B] font-semibold">❌ Failed: {parsedError}</span>);
      showToast("error", parsedError);
    } finally { setBusy(null); }
  }

  return (
    <section className="bg-[#E8EDE0] border border-[#DCE8DF] rounded-2xl p-5 text-left">
      <h2 className="text-[#123C2D] text-xl font-bold mb-4">Create Escrow</h2>
      <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
        <label className="grid gap-1 text-sm font-semibold text-[#123C2D]">
          Seller address
          <input className="border border-[#DCE8DF] rounded-lg p-3 bg-white text-[#18201C] outline-none transition focus:border-[#123C2D] disabled:opacity-60 disabled:cursor-not-allowed" value={seller} onChange={(e) => { setSeller(e.target.value); setIsApproved(false); }} placeholder="0x..." disabled={isWrongNetwork} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-[#123C2D]">
          Amount in ERC-20 USDC (6 decimals)
          <input className="border border-[#DCE8DF] rounded-lg p-3 bg-white text-[#18201C] outline-none transition focus:border-[#123C2D] disabled:opacity-60 disabled:cursor-not-allowed" value={amount} onChange={(e) => { setAmount(e.target.value); setIsApproved(false); }} placeholder="e.g. 50.0" disabled={isWrongNetwork} />
        </label>
        <div className="flex gap-4 flex-wrap mt-2">
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            {isApproved ? (
              <span className="border border-[#123C2D] text-[#123C2D] font-bold text-sm rounded-lg px-5 py-3 select-none text-center">✓ USDC Approved</span>
            ) : (
              <button className={`font-semibold text-sm rounded-lg px-5 py-3 transition cursor-pointer ${!canSubmit || busy ? "bg-[#B8B8B0] text-[#18201C] opacity-50 cursor-not-allowed" : "bg-[#123C2D] hover:bg-[#0B2A20] text-[#F6F1E7]"}`} disabled={!canSubmit || !!busy} onClick={approveUsdc}>
                {busy === "approve" ? "Processing..." : "Approve USDC"}
              </button>
            )}
            {!isApproved && approveGasFee && (
              <span className="text-[11px] text-[#18201C]/70 ml-1 font-medium animate-fadeIn">Est. fee: {approveGasFee}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <button className={`font-semibold text-sm rounded-lg px-5 py-3 transition ${!canSubmit || !isApproved || busy ? "bg-[#B8B8B0] text-[#18201C]/60 opacity-50 cursor-not-allowed" : "bg-[#123C2D] hover:bg-[#0B2A20] text-[#F6F1E7] cursor-pointer"}`} disabled={!canSubmit || !isApproved || !!busy} onClick={createEscrow}>
              {busy === "create" ? "Processing..." : "Lock USDC"}
            </button>
            {isApproved && lockGasFee && (
              <span className="text-[11px] text-[#18201C]/70 ml-1 font-medium animate-fadeIn">Est. fee: {lockGasFee}</span>
            )}
          </div>
        </div>
      </form>
      <p className="text-xs text-[#18201C] mt-3 leading-relaxed">{status}</p>
    </section>
  );
}
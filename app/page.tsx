"use client";
import { useEffect, useState, useRef } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { CreateEscrow } from "./components/CreateEscrow";
import { ReleaseEscrow } from "./components/ReleaseEscrow";
import { WalletConnect } from "./components/WalletConnect";
import { MyEscrows } from "./components/MyEscrows";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arcChain";
import { useToast } from "./components/Toast";

export default function HomePage() {
  const [mnt, setMnt] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { showToast } = useToast();
  const [escrowIdToRelease, setEscrowIdToRelease] = useState("");
  const [isEscrowLocked, setIsEscrowLocked] = useState(false);
  const releaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMnt(true); }, []);

  const handleLockSuccess = (id: string) => {
    setEscrowIdToRelease(id);
    setIsEscrowLocked(true);
  };

  const handleSelectEscrow = (id: string) => {
    setEscrowIdToRelease(id);
  };

  const showRelease = isEscrowLocked || escrowIdToRelease !== "";

  useEffect(() => {
    if (showRelease) {
      setTimeout(() => {
        releaseRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [showRelease, escrowIdToRelease]);

  if (!mnt) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] flex items-center justify-center">
        <div className="text-[#123C2D] font-bold text-lg animate-pulse">Loading ArcΞ Escrow...</div>
      </div>
    );
  }

  const isWrongNetwork = isConnected && chainId !== ARC_TESTNET_CHAIN_ID;

  return (
    <div className="min-h-screen bg-[#F6F1E7] flex flex-col text-[#18201C]">
      {/* Header / Navbar */}
      <header className="bg-[#0B2A20] px-6 py-4 flex justify-between items-center w-full shadow-md z-40">
        {/* Logo wordmark */}
        <div className="flex items-center bg-[#F6F1E7] px-3.5 py-1.5 rounded-full select-none shadow-sm">
          <span className="font-black text-lg text-[#123C2D] tracking-wider">ArcΞ</span>
        </div>
        {/* Wallet connection info */}
        <WalletConnect variant="navbar" />
      </header>

      {/* Network Warning Banner */}
      {isWrongNetwork && (
        <div className="bg-[#FEF3C7] border-b border-[#F59E0B] px-6 py-3 flex flex-wrap justify-between items-center w-full z-30 shadow-sm animate-fadeIn gap-4">
          <div className="flex items-center gap-2.5 text-[#92400E] text-sm font-semibold">
            <svg className="w-5 h-5 flex-shrink-0 text-[#D97706]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>You are connected to the wrong network. Please switch to Arc Testnet to transact.</span>
          </div>
          <button
            onClick={async () => {
              try {
                await switchChainAsync({ chainId: ARC_TESTNET_CHAIN_ID });
              } catch (err: any) {
                showToast("error", "Failed to switch network: " + (err?.message || err));
              }
            }}
            disabled={isSwitchingChain}
            className="px-4 py-1.5 bg-[#123C2D] hover:bg-[#0B2A20] disabled:bg-[#B8B8B0] disabled:cursor-not-allowed text-[#F6F1E7] font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
          >
            {isSwitchingChain ? "Switching..." : "Switch Network"}
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-10 relative flex flex-col justify-center">
        {!isConnected ? (
          /* Welcome State */
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {/* Logo Watermark */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0 overflow-hidden">
              <span className="text-[130px] sm:text-[180px] md:text-[230px] font-black text-[#123C2D] opacity-[0.03]">
                ArcΞ
              </span>
            </div>
            {/* Welcome Card (Option A) */}
            <div className="relative z-10 max-w-md w-full bg-[#E8EDE0] border border-[#DCE8DF] rounded-2xl p-8 shadow-lg text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123C2D] mb-4">
                Welcome to ArcΞ Escrow
              </h1>
              <p className="text-[#18201C] text-sm mb-6 leading-relaxed">
                Secure and instant USDC escrow transactions on Arc Testnet. Gas fees use native USDC (18 decimals), and locked contracts use ERC-20 USDC (6 decimals).
              </p>
              <div className="flex justify-center">
                <WalletConnect variant="hero" />
              </div>
            </div>
          </div>
        ) : (
          /* Connected State: Step-by-Step Transaction Flow */
          <div className="flex flex-col gap-8 z-10 w-full animate-fadeIn">
            {/* Intro Section */}
            <section className="bg-[#E8EDE0] border border-[#DCE8DF] rounded-2xl p-6 text-left">
              <h1 className="text-2xl md:text-3xl font-black text-[#123C2D] mb-2">
                Arc Testnet Escrow
              </h1>
              <p className="text-sm text-[#18201C]/80 leading-relaxed">
                Step-by-step transaction pipeline. Approve the desired amount of USDC, lock the capital into the escrow contract, and release the funds upon product delivery.
              </p>
            </section>

            {/* Step 1: Create Escrow */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center bg-[#123C2D] text-[#F6F1E7] rounded-full w-6 h-6 font-bold text-xs">1</span>
                <span className="font-bold text-sm uppercase text-[#123C2D] tracking-wide">Lock Capital</span>
              </div>
              <CreateEscrow onLockSuccess={handleLockSuccess} />
            </div>

            {/* Step 2: Release Escrow (Conditionally revealed / auto-scrolled to) */}
            {showRelease && (
              <div ref={releaseRef} className="transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center bg-[#123C2D] text-[#F6F1E7] rounded-full w-6 h-6 font-bold text-xs">2</span>
                  <span className="font-bold text-sm uppercase text-[#123C2D] tracking-wide">Payout Funds</span>
                </div>
                <ReleaseEscrow escrowId={escrowIdToRelease} setEscrowId={setEscrowIdToRelease} />
              </div>
            )}

            {/* Always visible: My Escrows */}
            <div className="border-t border-[#DCE8DF] pt-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center bg-[#123C2D] text-[#F6F1E7] rounded-full w-6 h-6 font-bold text-xs">3</span>
                <span className="font-bold text-sm uppercase text-[#123C2D] tracking-wide">Escrow Ledger</span>
              </div>
              <MyEscrows onSelectEscrowId={handleSelectEscrow} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
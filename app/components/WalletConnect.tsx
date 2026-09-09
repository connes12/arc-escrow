"use client";
import { useEffect, useState, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ARC_TESTNET_CHAIN_ID, USDC_ADDRESS, usdcAbi } from "@/lib/arcChain";

export function WalletConnect({ variant = "navbar" }: { variant?: "navbar" | "hero" }) {
  const [mnt, setMnt] = useState(false);
  const [mod, setMod] = useState(false);
  const [drop, setDrop] = useState(false);
  const [cop, setCop] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { address: addr, isConnected } = useAccount();
  const { connect: conn, connectors: conns } = useConnect();
  const { disconnect: disc } = useDisconnect();
  const chainId = useChainId();
  const { switchChainAsync: swCh, isPending: swBg } = useSwitchChain();
  const gasB = useBalance({ address: addr, query: { enabled: !!addr } });
  const tokB = useReadContract({ address: USDC_ADDRESS, abi: usdcAbi, functionName: "balanceOf", args: addr ? [addr] : undefined, query: { enabled: !!addr } });

  useEffect(() => {
    setMnt(true);
    const clickOut = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setDrop(false); };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  if (!mnt) return <button className="px-4 py-2 bg-[#123C2D] text-[#F6F1E7] rounded-lg font-semibold text-sm" disabled>Loading...</button>;
  if (variant === "hero" && isConnected) return null;

  const short = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
  const okNet = chainId === ARC_TESTNET_CHAIN_ID;
  const gas = gasB.data ? parseFloat(formatUnits(gasB.data.value, gasB.data.decimals)).toFixed(4) : "0.0000";
  const erc = tokB.data ? parseFloat(formatUnits(tokB.data as bigint, 6)).toFixed(2) : "0.00";

  return (
    <div className="relative" ref={ref}>
      {isConnected ? (
        variant === "navbar" && (
          <div>
            <button className="flex items-center gap-2 rounded-full px-4 py-2 border border-[#DCE8DF] bg-[#E8EDE0] hover:bg-[#DCE8DF] cursor-pointer" onClick={() => setDrop(!drop)}>
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="text-[#123C2D] font-semibold text-sm">{short}</span>
              <span className="text-[10px] text-[#123C2D] ml-1">{drop ? "▲" : "▼"}</span>
            </button>
            {drop && (
              <div className="absolute top-[125%] right-0 w-60 bg-[#E8EDE0] border border-[#123C2D] rounded-xl p-3 shadow-lg z-50 flex flex-col gap-2 text-left">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-[#18201C]/60">
                    <span>Wallet</span>
                    <button className="text-[#123C2D] underline cursor-pointer" onClick={() => { navigator.clipboard.writeText(addr!); setCop(true); setTimeout(() => setCop(false), 1500); }}>{cop ? "✓" : "Copy"}</button>
                  </div>
                  <strong className="text-xs truncate block text-[#18201C]">{addr}</strong>
                </div>
                <div className="border-t border-[#DCE8DF] pt-2">
                  <div className="flex justify-between text-[11px] font-semibold text-[#18201C]/60">
                    <span>Network</span>
                    <span className={`text-[10px] font-bold ${okNet ? "text-[#065F46]" : "text-[#D97706]"}`}>{okNet ? "Arc Testnet" : "Wrong Network"}</span>
                  </div>
                  {!okNet && <button className="bg-[#123C2D] text-white text-xs py-1 rounded w-full mt-1" onClick={() => swCh({ chainId: ARC_TESTNET_CHAIN_ID })} disabled={swBg}>Switch</button>}
                </div>
                <div className="border-t border-[#DCE8DF] pt-2 text-xs text-[#18201C]">
                  <span className="text-[11px] font-semibold text-[#18201C]/60">USDC Balances</span>
                  <div className="flex justify-between"><span>Gas:</span><strong>{gas}</strong></div>
                  <div className="flex justify-between"><span>ERC-20:</span><strong>{erc}</strong></div>
                </div>
                <button className="border border-[#123C2D] text-xs py-1.5 rounded-lg w-full mt-1 text-[#123C2D] font-bold hover:bg-[#DCE8DF]" onClick={() => { disc(); setDrop(false); }}>Disconnect</button>
              </div>
            )}
          </div>
        )
      ) : (
        <button className={`${variant === "hero" ? "px-8 py-3 bg-[#123C2D] text-white rounded-xl shadow-md" : "px-4 py-2 text-sm rounded-lg bg-[#123C2D] text-white"} font-semibold cursor-pointer hover:bg-[#0B2A20] transition-all`} onClick={() => setMod(true)}>Connect Wallet</button>
      )}
      {mod && (
        <div className="modal-overlay" onClick={() => setMod(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-2">
              <h3 className="text-[#123C2D] font-bold">Select Wallet</h3>
              <button className="text-xl font-bold" onClick={() => setMod(false)}>&times;</button>
            </div>
            <div className="grid gap-2 mt-4">
              {conns.map((c) => (
                <button key={c.uid} className="border border-[#DCE8DF] rounded bg-[#F6F1E7] p-2 hover:bg-[#DCE8DF] w-full text-left font-semibold text-[#123C2D]" onClick={() => { conn({ connector: c }); setMod(false); }}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
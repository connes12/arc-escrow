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
  status: number;
}

export function MyEscrows({ onSelectEscrowId }: { onSelectEscrowId: (id: string) => void }) {
  const [mnt, setMnt] = useState(false);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [escrows, setEscrows] = useState<EscrowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("Connect wallet to see escrows.");

  useEffect(() => { setMnt(true); }, []);

  const fetchMyEscrows = useCallback(async () => {
    if (!isConnected || !address || !publicClient) {
      setEscrows([]);
      setMsg("Connect wallet to see escrows.");
      return;
    }
    if (!escrowContractAddress) {
      setMsg("Escrow contract address not configured.");
      return;
    }
    setLoading(true);
    setMsg("Loading...");
    try {
      let ids: bigint[] = [];
      const stored = localStorage.getItem(`myEscrowIds_${address.toLowerCase()}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) ids = parsed.map(id => BigInt(id));
      }

      const items: EscrowItem[] = [];
      for (const eid of ids) {
        try {
          const raw = await publicClient.readContract({
            address: escrowContractAddress,
            abi: ESCROW_ABI,
            functionName: "getEscrow",
            args: [eid],
          }) as any;
          if (raw) {
            items.push({
              escrowId: eid.toString(),
              seller: raw.seller || raw[1],
              amount: BigInt(raw.amount !== undefined ? raw.amount : raw[2]),
              status: Number(raw.status !== undefined ? raw.status : raw[3]),
            });
          }
        } catch (err) {
          console.error(`Error loading ${eid}:`, err);
        }
      }
      items.sort((a, b) => Number(b.escrowId) - Number(a.escrowId));
      setEscrows(items);
      setMsg(items.length === 0 ? "No escrows created yet." : `Loaded ${items.length} escrow(s).`);
    } catch (error) {
      setMsg("Failed to load escrows.");
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, publicClient]);

  useEffect(() => { if (mnt && isConnected) fetchMyEscrows(); }, [mnt, isConnected, fetchMyEscrows]);

  if (!mnt || !isConnected) return null;

  return (
    <section className="bg-[#E8EDE0] border border-[#DCE8DF] rounded-2xl p-5 text-left transition-all">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[#123C2D] text-xl font-bold">My Escrows</h2>
        <button className="border border-[#123C2D] text-[#123C2D] hover:bg-[#DCE8DF] text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer" disabled={loading} onClick={fetchMyEscrows}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <p className="text-xs text-[#18201C] mb-4 font-semibold">{msg}</p>
      {escrows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#DCE8DF]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#123C2D] text-[#F6F1E7]">
                <th className="p-3 text-xs font-semibold">ID</th>
                <th className="p-3 text-xs font-semibold">Seller</th>
                <th className="p-3 text-xs font-semibold">Amount</th>
                <th className="p-3 text-xs font-semibold">Status</th>
                <th className="p-3 text-xs font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {escrows.map((esc, i) => {
                const isEven = i % 2 === 1;
                return (
                  <tr key={esc.escrowId} className={`border-b border-[#DCE8DF] ${isEven ? "bg-[#F6F1E7]" : "bg-white"} text-sm text-[#18201C]`}>
                    <td className="p-3 font-semibold text-xs">#{esc.escrowId}</td>
                    <td className="p-3 text-xs truncate max-w-[100px]" title={esc.seller}>{esc.seller.slice(0, 6)}...{esc.seller.slice(-4)}</td>
                    <td className="p-3 font-semibold text-xs">{formatUnits(esc.amount, 6)} USDC</td>
                    <td className="p-3">
                      {esc.status === 1 ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]">Funded</span>
                      ) : esc.status === 2 ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D1FAE5] text-[#065F46] border border-[#10B981]">Released</span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F4F6] text-[#4B5563] border border-[#9CA3AF]">Refunded</span>
                      )}
                    </td>
                    <td className="p-3">
                      {esc.status === 1 ? (
                        <button className="bg-[#123C2D] hover:bg-[#0B2A20] text-white text-xs font-bold px-2.5 py-1 rounded-md transition cursor-pointer" onClick={() => onSelectEscrowId(esc.escrowId)}>Release</button>
                      ) : (
                        <span className="text-xs text-[#18201C]/60">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
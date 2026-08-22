"use client";

import { useState } from "react";
import { CreateEscrow } from "@/components/CreateEscrow";
import { NetworkCheck } from "@/components/NetworkCheck";
import { ReleaseEscrow } from "@/components/ReleaseEscrow";
import { UsdcBalance } from "@/components/UsdcBalance";
import { WalletConnect } from "@/components/WalletConnect";
import { MyEscrows } from "@/components/MyEscrows";

export default function HomePage() {
  const [escrowIdToRelease, setEscrowIdToRelease] = useState("");

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "grid", gap: 20 }}>
        <section>
          <h1 style={{ fontSize: 36, marginBottom: 8 }}>Arc Testnet USDC Escrow</h1>
          <p style={{ color: "#b8c0d0", lineHeight: 1.6 }}>
            Create and release ERC-20 USDC escrows on Arc Testnet. Gas uses native USDC with 18
            decimals, while escrowed ERC-20 USDC balances use 6 decimals.
          </p>
        </section>
        <WalletConnect />
        <NetworkCheck />
        <UsdcBalance />
        <CreateEscrow />
        <ReleaseEscrow escrowId={escrowIdToRelease} setEscrowId={setEscrowIdToRelease} />
        <MyEscrows onSelectEscrowId={setEscrowIdToRelease} />
      </div>
    </main>
  );
}

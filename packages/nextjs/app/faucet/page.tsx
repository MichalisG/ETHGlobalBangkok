"use client";

import dynamic from "next/dist/shared/lib/dynamic";
import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { notification } from "~~/utils/scaffold-eth/notification";

function Faucet() {
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  console.log('🚀 ~ Faucet ~ error:', error)
  console.log("🚀 ~ Faucet ~ data:", hash);
  const { isLoading: isTransactionLoading } = useWaitForTransactionReceipt({
    hash,
  });

  const mintTokens = async () => {
    try {
      setLoading(true);
      writeContract({
        address: deployedContracts[23295].USDC.address,
        abi: deployedContracts[23295].USDC.abi,
        functionName: "mint",
        args: [BigInt(10)],
      });
    } catch (error) {
      console.error("Error minting tokens:", error);
      notification.error("Error minting tokens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">USDC Faucet</h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={mintTokens}
        disabled={loading || isTransactionLoading}
      >
        {loading || isTransactionLoading ? "Minting..." : "Get 10 USDC"}
      </button>
    </div>
  );
}

const FaucetNoSSR = dynamic(() => Promise.resolve(Faucet), { ssr: false });

export default function Page() {
  return <FaucetNoSSR />;
}

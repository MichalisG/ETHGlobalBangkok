"use client";

import { FC } from "react";
import dynamic from "next/dynamic";
import AuctionCard from "./AuctionCard";
import { useReadContract } from "wagmi";
import deployContracts from "~~/contracts/deployedContracts";

interface AuctionsProps {
  auctions?: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl: string;
  }>;
}

const Auctions: FC<AuctionsProps> = ({ auctions = [] }) => {
  const { data: auctionsLength } = useReadContract({
    address: deployContracts[23295].LUBA.address,
    abi: deployContracts[23295].LUBA.abi,
    functionName: "auctionsLength",
    query: {
      initialData: 2n,
      select: () => 2,
    },
  });

  return (
    <div className="container mx-auto p-4">
      <h1>Auctions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {auctionsLength &&
          Array.from({ length: Number(auctionsLength) }).map((_, index) => (
            <AuctionCard key={index} auctionId={index.toString()} />
          ))}
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Auctions), { ssr: false });

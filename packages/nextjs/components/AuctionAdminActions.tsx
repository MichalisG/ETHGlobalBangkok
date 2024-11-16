"use client";

import { Button } from "./ui/button";
import { useAccount, useWriteContract } from "wagmi";
import { useReadContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

export default function AuctionAdminActions(props: { auctionId: string }) {
  const { auctionId } = props;
  const { address: connectedAddress } = useAccount();

  const { data: auctionData, isPending: isAuctionLoading } = useReadContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "getPublicAuctionData",
    args: [BigInt(auctionId as string)],
  });

  const [endTime, biddingUnit, bidsCount, creator] = auctionData || [];

  const isAdmin = !!connectedAddress && connectedAddress === creator;

  const { data: adminData, isPending: isAdminLoading } = useReadContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "getCreatorAuctionData",
    args: [BigInt(auctionId as string)],
    query: {
      enabled: isAdmin,
    },
  });

  const { writeContract, isPending: isClosingAuction } = useWriteContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "closeAuction",
    args: [BigInt(auctionId as string)],
  });

  if (!isAuctionLoading && !isAdminLoading) {
    return <div>Loading...</div>;
  }

  if (!connectedAddress) {
    return <div>Please connect your wallet to view this auction</div>;
  }

  const [totalBidAmount, numberOfBids = 2, withdrawn] = adminData || [];

  return (
    <div className="flex flex-col justify-between gap-4 h-full">
      <div className="space-y-4">
        <p className="text-muted-foreground">Bids submitted</p>
        <h1 className="text-4xl font-bold">{numberOfBids}</h1>
      </div>

      <div>
        <p className="text-muted-foreground">Admin actions</p>
        <Button variant="destructive" className="w-full my-8" onClick={() => writeContract()}>
          Close auction
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useAccount, useReadContract } from "wagmi";
import { useReadContractm, useWriteContract } from "wagmi";
import AuctionField from "~~/components/AuctionField";
import { Badge } from "~~/components/ui/badge";
import deployedContracts from "~~/contracts/deployedContracts";
import { formatEther, parseEther } from "viem";

const fromWei = (value: bigint) => {
  return Number(value) / 10 ** 18;
};

export default function AuctionBidderActions({ auctionId }: { auctionId: string }) {
  const { address: connectedAddress } = useAccount();

  const { data: personalBids, isPending: isPersonalBidsLoading } = useReadContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "readYourBids",
    args: [BigInt(auctionId as string)],
    query: {
      select: bids => bids.map(bid => bid.amount),
    },
  });

  const { data: auctionData, isPending: isAuctionLoading } = useReadContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "getPublicAuctionData",
    args: [BigInt(auctionId as string)],
  });

  const [endTime, biddingUnit, bidsCount, creator] = auctionData || [];

  const { writeContract: makeBid, error } = useWriteContract();

  const bid = async (multiplier: number) => {
    try {
      await makeBid({
        address: deployedContracts[23295].LUBA.address,
        abi: deployedContracts[23295].LUBA.abi,
        functionName: "placeBid",
        args: [BigInt(auctionId), BigInt(multiplier)],
        __mode: "prepared",
      });
    } catch (error) {
      console.error("Error making bid:", error);
    }
  };

  if (isPersonalBidsLoading) {
    return <div>Loading...</div>;
  }

  if (!connectedAddress) {
    return <div>Please connect your wallet to view this auction</div>;
  }

  return (
    <div className="flex-1 flex flex-col justify-between py-20">
      <div className="space-y-2 mb-8">
        <h3 className="text-lg font-semibold">Your bids</h3>
        <div className="flex flex-wrap gap-2">
          {/* Example bid badges - you'll need to fetch actual user bids */}
          {personalBids?.length ? (
            personalBids.map((bid, index) => (
              <Badge variant="outline" key={index}>
                {fromWei(bid)} TEST
              </Badge>
            ))
          ) : (
            <div>No bids yet</div>
          )}
        </div>
      </div>

      {/* <div className="grid gap-4">
      <h3 className="text-lg font-semibold">Details</h3>
      <div className="flex flex-col items-center space-y-2">
        {biddingUnit && (
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Bidding Unit:</span>
            <span className="font-medium">{fromWei(biddingUnit)} TEST</span>
          </div>
        )}
        {bidsCount !== undefined && (
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Bids Count:</span>
            <span className="font-medium">{bidsCount.toString()}</span>
          </div>
        )}
      </div>
    </div> */}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">New bid</h3>
        {biddingUnit && <AuctionField baseUnit={Number(formatEther(biddingUnit))} onBidSubmit={bid} />}
      </div>
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";
import Countdown from "react-countdown";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import Balance from "~~/components/Balance";
import { MakeBid } from "~~/components/MakeBid";
import deployedContracts from "~~/contracts/deployedContracts";

const AuctionState = ({ endTime }: { endTime: bigint }) => {
  const endDate = new Date(Number(endTime) * 1000);
  const now = new Date();

  if (endDate < now) {
    return <div className="text-gray-800 bg-gray-200 p-2 rounded-md">Auction Closed</div>;
  } else {
    return (
      <div className="flex flex-col items-center justify-center">
        <p>Auction Ends in</p>
        <Countdown date={Number(endTime) * 1000} />
      </div>
    );
  }
};

const fromWei = (value: bigint) => {
  return Number(value) / 10 ** 18;
};

export default function AuctionPage() {
  const { auctionId } = useParams();
  const { address: connectedAddress } = useAccount();

  const { data: auctionData, isPending: isAuctionLoading } = useReadContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "getPublicAuctionData",
    args: [BigInt(auctionId as string)],
  });

  if (isAuctionLoading) {
    return <div>Loading...</div>;
  }

  if (!connectedAddress) {
    return <div>Please connect your wallet to view this auction</div>;
  }

  const [endTime, biddingUnit, bidsCount] = auctionData || [];

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-4xl font-bold">Auction #{auctionId}</h1>
      {auctionData && (
        <div className="grid gap-4">
          <div>
            <h2 className="text-2xl">Details</h2>
            <div className="flex flex-col items-center justify-center">
              {biddingUnit && <p>Bidding Unit: {fromWei(biddingUnit)} TEST</p>}
              {bidsCount !== undefined && <p>Bids Count: {bidsCount.toString()}</p>}
            </div>
            {endTime && <AuctionState endTime={endTime} />}
          </div>
        </div>
      )}
      {biddingUnit && <MakeBid auctionId={auctionId as string} biddingUnit={biddingUnit?.toString()} />}
      <Balance connectedAddress={connectedAddress} />
    </div>
  );
}

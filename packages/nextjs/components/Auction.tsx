import Link from "next/link";
import { FC } from "react";
import Countdown from "react-countdown";
import { useReadContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

interface AuctionCardProps {
  auctionId: string;
}

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

const AuctionCard: FC<AuctionCardProps> = ({ auctionId }) => {
  const { data: auctionData } = useReadContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "getAuction",
    args: [BigInt(auctionId)],
  });

  const [endTime, biddingUnit, bidsCount] = auctionData || [];

  return (
    <Link href={`/auction/${auctionId}`}>
    <div className="card lg:card-side bg-base-100 shadow-xl ">
      <figure>{/* <img src={imageUrl} alt={title} /> */}</figure>
      <div className="card-body">
        <div className="flex flex-col items-center justify-center">
          {biddingUnit && <p>Bidding Unit: {fromWei(biddingUnit)} TEST</p>}
          {bidsCount !== undefined && <p>Bids Count: {bidsCount.toString()}</p>}
          </div>
            {endTime && <AuctionState endTime={endTime} />}
        </div>
      </div>
    </Link>
  );
};

export default AuctionCard;

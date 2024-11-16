/* eslint-disable @next/next/no-img-element */
import { FC } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import * as chrono from "chrono-node";
import Countdown from "react-countdown";
import { useReadContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import IPhoneImage from "~~/public/iphone.webp";
import LegoImage from "~~/public/lego.png";
import RolexImage from "~~/public/rolex.png";
import ShoesImage from "~~/public/shoes.png";
import StarWarsImage from "~~/public/star-wars.png";

const AUCTION_PLACEHOLDER_DATA = [
  { image: RolexImage, title: "Rolex", description: "A brand new Rolex watch" },
  { image: IPhoneImage, title: "iPhone", description: "A brand new iPhone 15" },
  { image: LegoImage, title: "Lego", description: "A brand new Lego set" },
  { image: ShoesImage, title: "Shoes", description: "A brand new pair of shoes" },
  { image: StarWarsImage, title: "Star Wars", description: "A brand new Star Wars action figure" },
];

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
  const { data: auctionData, isPending: isAuctionLoading } = useReadContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "getPublicAuctionData",
    args: [BigInt(auctionId)],
  });

  const [endTime = 12n, biddingUnit = 12n, bidsCount = 12n] = auctionData || [];

  return (
    <Link href={`/auction/${auctionId}`}>
      <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
        <CardHeader>
          <p className="text-muted-foreground text-sm">Auction #{auctionId}</p>
          <CardTitle>
            <h2 className="text-2xl font-bold">{AUCTION_PLACEHOLDER_DATA[Number(auctionId)].title}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <hr className="border border-gray-200 mb-8" />
          <div className="aspect-square relative rounded-xl overflow-hidden bg-muted">
            <img
              className="w-full h-full object-cover object-center"
              src={AUCTION_PLACEHOLDER_DATA[Number(auctionId)].image.src}
              alt={AUCTION_PLACEHOLDER_DATA[Number(auctionId)].title}
            />
          </div>
          {/* <div className="card-body">
            <div className="flex flex-col items-center justify-center">
              {biddingUnit && <p>Bidding Unit: {fromWei(biddingUnit)} TEST</p>}
              {bidsCount !== undefined && <p>Bids Count: {bidsCount.toString()}</p>}
            </div>
          </div> */}
          <hr className="border border-gray-200 my-8" />
          <CardDescription>{endTime && <AuctionState endTime={endTime} />}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};

export default AuctionCard;

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Countdown from "react-countdown";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import AuctionAdminActions from "~~/components/AuctionAdminActions";
import AuctionBidderActions from "~~/components/AuctionBidderActions";
import AuctionField from "~~/components/AuctionField";
import { Badge } from "~~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/card";
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

const AuctionState = ({ endTime }: { endTime: bigint }) => {
  const endDate = new Date(Number(endTime) * 1000);
  const now = new Date();

  if (endDate < now) {
    return <Badge variant="secondary">Auction Closed</Badge>;
  } else {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <p className="text-muted-foreground">Auction Ends in</p>
        <Countdown date={Number(endTime) * 1000} className="text-xl font-semibold" />
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

  const { data: personalBids } = useReadContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "readYourBids",
    args: [BigInt(auctionId as string)],
    query: {
      select: bids => bids.map(bid => bid.amount),
    },
  });

  const [endTime, biddingUnit, bidsCount, creator] = auctionData || [];

  const isAdmin = !!connectedAddress && connectedAddress === creator;

  if (isAuctionLoading) {
    return <div>Loading...</div>;
  }

  if (!connectedAddress) {
    return <div>Please connect your wallet to view this auction</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          All auctions
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center text-4xl font-bold">
            {AUCTION_PLACEHOLDER_DATA[Number(auctionId) % AUCTION_PLACEHOLDER_DATA.length].title}
          </CardTitle>
          <CardDescription className="text-center">
            <p>{AUCTION_PLACEHOLDER_DATA[Number(auctionId) % AUCTION_PLACEHOLDER_DATA.length].description}</p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <hr className="my-4 border-t border-border" />

          <div className="flex justify-between gap-4">
            <div className="aspect-square relative flex-1">
              <img src={AUCTION_PLACEHOLDER_DATA[Number(auctionId) % AUCTION_PLACEHOLDER_DATA.length].image.src} />
            </div>
            <div className="flex-1">
              {!isAdmin ? (
                <AuctionAdminActions auctionId={auctionId as string} />
              ) : (
                <AuctionBidderActions auctionId={auctionId as string} />
              )}
            </div>
          </div>
          <hr className="my-4 border-t border-border" />
          {endTime && <AuctionState endTime={endTime} />}
        </CardContent>
      </Card>
    </div>
  );
}

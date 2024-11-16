import { useState } from "react";
import { formatEther } from "viem";
import { useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

interface MakeBidProps {
  auctionId: string;
  biddingUnit: string;
}

export const MakeBid = ({ auctionId, biddingUnit }: MakeBidProps) => {
  const [bidAmount, setBidAmount] = useState("");

  const { writeContract: makeBid, error } = useWriteContract();
  console.log("🚀 ~ MakeBid ~ error:", error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await makeBid({
        address: deployedContracts[23295].LUBA.address,
        abi: deployedContracts[23295].LUBA.abi,
        functionName: "placeBid",
        args: [BigInt(auctionId), BigInt(Number(bidAmount) / Number(formatEther(BigInt(biddingUnit))))],
        __mode: "prepared",
      });
    } catch (error) {
      console.error("Error making bid:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-base-200 rounded-lg">
      <h3 className="text-lg font-bold">Make a Bid</h3>
      <input
        type="number"
        step={formatEther(BigInt(biddingUnit))}
        value={bidAmount}
        onChange={e => setBidAmount(e.target.value)}
        placeholder="Enter bid amount"
        className="input input-bordered"
      />
      <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
        Place Bid
      </button>
    </div>
  );
};

export default AuctionField;

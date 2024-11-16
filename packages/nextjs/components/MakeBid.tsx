import { useState } from "react";
import { useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

interface MakeBidProps {
  auctionId: string;
}

export const MakeBid = ({ auctionId }: MakeBidProps) => {
  const [bidAmount, setBidAmount] = useState("");

  // const { write: makeBid } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // await makeBid();
      setBidAmount("");
    } catch (error) {
      console.error("Error making bid:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-base-200 rounded-lg">
      <h3 className="text-lg font-bold">Make a Bid</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          placeholder="Enter bid amount"
          className="input input-bordered"
        />
        <button type="submit" className="btn btn-primary">
          Place Bid
        </button>
      </form>
    </div>
  );
};

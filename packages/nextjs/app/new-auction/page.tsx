"use client";

import { useState } from "react";
import dynamic from "next/dist/shared/lib/dynamic";
import DateTimePicker from "react-datetime-picker";
import { useAccount, useWriteContract } from "wagmi";
import deployContracts from "~~/contracts/deployedContracts";
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';

type ValuePiece = Date | null;

type Value = ValuePiece;

const NewAuction = () => {
  const { address } = useAccount();
  const [endTime, setEndTime] = useState<Value>(new Date());
  const [biddingUnit, setBiddingUnit] = useState<number>(1);

  const { writeContract: createAuction, isPending } = useWriteContract();

  const toWei = (value: number) => {
    return value * 10 ** 18;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endTime) return;
    await createAuction({
      address: deployContracts[23295].LUBA.address,
      abi: deployContracts[23295].LUBA.abi,
      functionName: "startAuction",
      args: [BigInt(Math.floor(endTime.getTime() / 1000)), BigInt(toWei(biddingUnit))],
    });
  };

  return (
    <div className="flex flex-col items-center pt-10">
      <h1 className="text-4xl font-bold mb-8">Create New Auction</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-96">
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium mb-2">
            End Time (Unix Timestamp)
          </label>
          <DateTimePicker value={endTime} onChange={setEndTime} />
        </div>
        <div>
          <label htmlFor="biddingUnit" className="block text-sm font-medium mb-2">
            Bidding Unit
          </label>
          <input
            type="number"
            step="0.01"
            disabled={isPending}
            value={biddingUnit}
            onChange={e => setBiddingUnit(parseFloat(e.target.value))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded">
          {isPending ? "Creating..." : "Create Auction"}
        </button>
      </form>
    </div>
  );
};

export default dynamic(() => Promise.resolve(NewAuction), { ssr: false });

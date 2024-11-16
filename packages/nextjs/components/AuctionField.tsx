import { useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AuctionFieldProps {
  baseUnit?: number;
  onBidSubmit?: (amount: number) => void;
  className?: string;
}

const AuctionField = ({ baseUnit = 20, onBidSubmit, className }: AuctionFieldProps) => {
  const [counter, setCounter] = useState(baseUnit);

  const increment = () => setCounter(prev => prev + baseUnit);
  const decrement = () => {
    if (counter > baseUnit) {
      setCounter(prev => prev - baseUnit);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={decrement} className="rounded-r-none">
            -
          </Button>
          <Input type="text" value={`$${counter}`} readOnly className="rounded-none text-center w-24 border-x-0" />
          <Button variant="outline" size="icon" onClick={increment} className="rounded-l-none">
            +
          </Button>
        </div>
        <Button onClick={() => onBidSubmit?.(counter)}>Bid</Button>
      </div>
      <p className="text-sm text-muted-foreground">Base unit: ${baseUnit} USD.</p>
    </div>
  );
};

export default AuctionField;

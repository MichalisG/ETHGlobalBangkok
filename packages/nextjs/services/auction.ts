interface Bid {
  amount: bigint;
  bidder: string;
}

export const findLowestAndMostUniqueBid = (bids: Bid[]) => {
  // Create a map to count occurrences of each bid amount
  const bidsByAmount = new Map<number, number>();

  // Count occurrences of each bid amount and store bidders
  for (const bid of bids) {
    bidsByAmount.set(Number(bid.amount), (bidsByAmount.get(Number(bid.amount)) || 0) + 1);
  }

  // Find the amount that appears the least number of times
  let minOccurrences = Infinity;
  let leastFrequentAmount: number | null = null;

  for (const [amount, count] of bidsByAmount) {
    if (count < minOccurrences) {
      minOccurrences = count;
      leastFrequentAmount = amount;
    }
  }

  if (leastFrequentAmount === null) {
    throw new Error("No bids found");
  }

  // Find the first bid with the least frequent amount
  const winningBid = bids.find(bid => BigInt(bid.amount) === BigInt(leastFrequentAmount));

  return winningBid;
};

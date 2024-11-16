import { expect } from "chai";
import { ethers } from "hardhat";
import { LUBA, USDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";

export const findLowestAndMostUniqueBid = (bids: LUBA.BidStruct[]) => {
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

export const signIn = async (signer: HardhatEthersSigner, luba: LUBA) => {
  const currentTime = await time.latest();
  const validUntil = currentTime + 24 * 60 * 60;
  const domain = await luba.eip712Domain();

  // All properties on a domain are optional
  const domainStruct = {
    name: domain.name,
    version: domain.version,
    chainId: domain.chainId,
    verifyingContract: domain.verifyingContract,
  };

  const signature = await signer.signTypedData(
    {
      ...domainStruct,
    },
    {
      SignIn: [
        { name: "user", type: "address" },
        { name: "time", type: "uint32" },
      ],
    },
    {
      user: signer.address,
      time: validUntil,
    },
  );

  const rsv = ethers.Signature.from(signature);
  return { user: signer.address, time: validUntil, rsv };
};

describe("LUBA Contract", function () {
  let luba: LUBA;
  let usdc: USDC;
  const biddingUnit = ethers.parseEther("0.01");
  let owner: HardhatEthersSigner;
  let bidder1: HardhatEthersSigner;
  let bidder2: HardhatEthersSigner;

  beforeEach(async () => {
    [owner, bidder1, bidder2] = await ethers.getSigners();
    const lubaFactory = await ethers.getContractFactory("LUBA");
    const usdcFactory = await ethers.getContractFactory("USDC");
    usdc = (await usdcFactory.deploy()) as USDC;
    await usdc.waitForDeployment();

    luba = (await lubaFactory.deploy(await usdc.getAddress())) as LUBA;
    await luba.waitForDeployment();
  });

  const createAuction = async (endIn = 3600) => {
    const endTime = (await time.latest()) + endIn;
    await (await luba.startAuction(endTime, biddingUnit)).wait();

    const logs = await luba.queryFilter(luba.getEvent("AuctionCreated"), 0, "latest");
    const latestAuctionId = logs.sort((a, b) => a.blockNumber - b.blockNumber)[logs.length - 1].args.auctionId;

    if (latestAuctionId === undefined) {
      throw new Error("AuctionId not found");
    }

    return Number(latestAuctionId);
  };

  const addBiddingBalance = async (signer: HardhatEthersSigner, amount: bigint) => {
    await usdc.connect(signer).mint(amount);
    await usdc.connect(signer).approve(luba.target, amount);
    await luba.connect(signer).addBalance(amount);
  };

  describe("Auction Creation", function () {
    it("should allow anyone to create an auction", async function () {
      const futureTime = (await time.latest()) + 3600; // 1 hour from now
      await expect(luba.startAuction(futureTime, biddingUnit))
        .to.emit(luba, "AuctionCreated")
        .withArgs(0, owner.address, futureTime, biddingUnit);
    });

    it("should not allow creating an auction in the past", async function () {
      const pastTime = (await time.latest()) - 3600; // 1 hour ago
      await expect(luba.startAuction(pastTime, biddingUnit)).to.be.revertedWith("End time must be in the future");
    });

    it("should not allow creating an auction with a bidding unit of 0", async function () {
      const futureTime = (await time.latest()) + 3600; // 1 hour from now
      await expect(luba.startAuction(futureTime, 0n)).to.be.revertedWith("Bidding unit must be greater than 0");
    });
  });

  describe("Bidding", function () {
    let auctionId: number;

    beforeEach(async function () {
      auctionId = await createAuction();
    });

    it("should accept valid bids", async function () {
      await addBiddingBalance(bidder1, biddingUnit * 10000n);

      await expect(luba.connect(bidder1).placeBid(auctionId, 10n))
        .to.emit(luba, "BidPlaced")
        .withArgs(auctionId, bidder1.address);
    });

    it("should allow placing duplicate bids", async function () {
      await addBiddingBalance(bidder1, biddingUnit * 10000n);
      await addBiddingBalance(bidder2, biddingUnit * 10000n);

      await luba.connect(bidder1).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 11n);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, __, bidsCount] = await luba.getPublicAuctionData(auctionId);
      expect(bidsCount).to.equal(2n);

      const bidder1Signature = await signIn(bidder1, luba);
      const bidder2Signature = await signIn(bidder2, luba);

      const bids = await luba.connect(bidder1).readYourBids(auctionId, bidder1Signature);
      expect(bids.length).to.equal(1);
      expect(bids[0].bidder).to.equal(bidder1.address);
      expect(bids[0].amount).to.equal(11n * biddingUnit);

      const bids2 = await luba.connect(bidder2).readYourBids(auctionId, bidder2Signature);
      expect(bids2.length).to.equal(1);
      expect(bids2[0].bidder).to.equal(bidder2.address);
      expect(bids2[0].amount).to.equal(11n * biddingUnit);
    });

    it("should not allow placing bids after the auction has ended", async function () {
      await addBiddingBalance(bidder1, biddingUnit * 10000n);

      await hre.network.provider.send("evm_increaseTime", [1_000_000]);
      await hre.network.provider.send("evm_mine", []);

      await expect(luba.connect(bidder1).placeBid(auctionId, 101n)).to.be.revertedWith(
        "Auction has ended or not existing",
      );
    });
  });

  describe("Bid Reading", function () {
    let auctionId: number;

    beforeEach(async function () {
      auctionId = await createAuction();
    });

    it("should allow reading your own bids", async function () {
      await addBiddingBalance(bidder1, biddingUnit * 10000n);
      await addBiddingBalance(bidder2, biddingUnit * 10000n);

      await luba.connect(bidder1).placeBid(auctionId, 11n);
      await luba.connect(bidder1).placeBid(auctionId, 22n);

      await luba.connect(bidder2).placeBid(auctionId, 22n);

      const bidder1Signature = await signIn(bidder1, luba);

      console.log("bidder1", bidder1.address);
      const bids = await luba.connect(bidder1).readYourBids(auctionId, bidder1Signature);
      expect(bids.length).to.equal(2);
      expect(bids[0].amount).to.equal(11n * biddingUnit);
      expect(bids[1].amount).to.equal(22n * biddingUnit);
    });
  });

  describe("Winning Bid", function () {
    let auctionId: number;

    beforeEach(async function () {
      auctionId = await createAuction();
    });

    it("should return the winning bid", async function () {
      await addBiddingBalance(bidder1, biddingUnit * 10000n);
      await addBiddingBalance(bidder2, biddingUnit * 10000n);

      await luba.connect(bidder1).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 22n);

      await hre.network.provider.send("evm_increaseTime", [1_000_000]);
      await hre.network.provider.send("evm_mine", []);

      const bids = await luba.revealBids(auctionId);
      expect(bids.length).to.equal(3);
      expect(bids[0].amount).to.equal(11n * biddingUnit);
      expect(bids[0].bidder).to.equal(bidder1.address);
      expect(bids[1].amount).to.equal(11n * biddingUnit);
      expect(bids[1].bidder).to.equal(bidder2.address);
      expect(bids[2].amount).to.equal(22n * biddingUnit);
      expect(bids[2].bidder).to.equal(bidder2.address);

      const winningBid = findLowestAndMostUniqueBid(bids);

      expect(winningBid?.amount).to.equal(22n * biddingUnit);
      expect(winningBid?.bidder).to.equal(bidder2.address);
    });

    it("should return the winning bid only if the auction has ended", async function () {
      await addBiddingBalance(bidder1, biddingUnit * 10000n);
      await addBiddingBalance(bidder2, biddingUnit * 10000n);

      await luba.connect(bidder1).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 22n);

      await expect(luba.revealBids(auctionId)).to.be.revertedWith("Auction has not ended yet");
    });
  });

  describe.skip("Withdrawal", function () {
    let auctionId: number;

    beforeEach(async function () {
      auctionId = await createAuction();
    });

    it("should allow the creator to withdraw the auction", async function () {
      await addBiddingBalance(bidder1, biddingUnit * 10000n);
      await addBiddingBalance(bidder2, biddingUnit * 10000n);

      await luba.connect(bidder1).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 22n);

      await hre.network.provider.send("evm_increaseTime", [1_000_000]);
      await hre.network.provider.send("evm_mine", []);

      const ownerSignature = await signIn(owner, luba);

      const [totalBidAmount] = await luba.connect(owner).getCreatorAuctionData(auctionId, ownerSignature);

      const balanceBeforeWithdrawal = await usdc.balanceOf(owner);
      await luba.connect(owner).withdrawBidPool(auctionId);

      const balanceAfterWithdrawal = await usdc.balanceOf(owner);
      expect(balanceAfterWithdrawal).to.be.greaterThan(balanceBeforeWithdrawal);
      expect(balanceAfterWithdrawal).to.equal(balanceBeforeWithdrawal + totalBidAmount);
    });

    it("should not allow the creator to withdraw the auction if the auction has not ended", async function () {
      await addBiddingBalance(bidder1, biddingUnit * 10000n);
      await addBiddingBalance(bidder2, biddingUnit * 10000n);

      await luba.connect(bidder1).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 22n);

      await expect(luba.connect(owner).withdrawBidPool(auctionId)).to.be.revertedWith("Auction has not ended yet");
    });

    it("should not allow the creator to withdraw the auction if the tokens have already been withdrawn", async function () {
      await addBiddingBalance(bidder1, biddingUnit * 10000n);
      await addBiddingBalance(bidder2, biddingUnit * 10000n);

      await luba.connect(bidder1).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 22n);

      await hre.network.provider.send("evm_increaseTime", [1_000_000]);
      await hre.network.provider.send("evm_mine", []);

      const ownerSignature = await signIn(owner, luba);

      const [totalBidAmount] = await luba.connect(owner).getCreatorAuctionData(auctionId, ownerSignature);

      const balanceBeforeWithdrawal = await usdc.balanceOf(owner);
      await luba.connect(owner).withdrawBidPool(auctionId);

      const balanceAfterWithdrawal = await usdc.balanceOf(owner);
      expect(balanceAfterWithdrawal).to.be.greaterThan(balanceBeforeWithdrawal);
      expect(balanceAfterWithdrawal).to.equal(balanceBeforeWithdrawal + totalBidAmount);

      await expect(luba.connect(owner).withdrawBidPool(auctionId)).to.be.revertedWith("Tokens already withdrawn");
    });
  });

  describe("Auction Data", function () {
    let auctionId: number;

    beforeEach(async function () {
      auctionId = await createAuction();
    });

    it("should return public auction data", async function () {
      const auctionData = await luba.getPublicAuctionData(auctionId);
      expect(auctionData.endTime).to.be.greaterThan(0);
      expect(auctionData.biddingUnit).to.equal(biddingUnit);
      expect(auctionData.bidsCount).to.equal(0);

      await addBiddingBalance(bidder1, biddingUnit * 10000n);
      await addBiddingBalance(bidder2, biddingUnit * 10000n);

      await luba.connect(bidder1).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 22n);

      const auctionData2 = await luba.getPublicAuctionData(auctionId);
      expect(auctionData2.bidsCount).to.equal(3);
    });

    it("should return creator auction data", async function () {
      const ownerSignature = await signIn(owner, luba);

      const auctionData = await luba.getCreatorAuctionData(auctionId, ownerSignature);
      expect(auctionData.totalBidAmount).to.equal(0);
      expect(auctionData.numberOfBids).to.equal(0);
      expect(auctionData.withdrawn).to.equal(false);

      await addBiddingBalance(bidder1, biddingUnit * 10000n);
      await addBiddingBalance(bidder2, biddingUnit * 10000n);

      await luba.connect(bidder1).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 22n);

      const auctionData2 = await luba.getCreatorAuctionData(auctionId, ownerSignature);
      expect(auctionData2.totalBidAmount).to.equal(44n * biddingUnit);
      expect(auctionData2.numberOfBids).to.equal(3);
      expect(auctionData2.withdrawn).to.equal(false);

      await hre.network.provider.send("evm_increaseTime", [1_000_000]);
      await hre.network.provider.send("evm_mine", []);

      await luba.connect(owner).withdrawBidPool(auctionId);

      const newOwnerSignature = await signIn(owner, luba);

      const auctionData3 = await luba.getCreatorAuctionData(auctionId, newOwnerSignature);
      expect(auctionData3.withdrawn).to.equal(true);
    });
  });

  describe.skip("Bidder Balance", function () {
    let auctionId: number;

    beforeEach(async function () {
      auctionId = await createAuction();
    });

    it("should allow reading the balance of a bidder", async function () {
      const bidder1Signature = await signIn(bidder1, luba);

      const wantedBalance = biddingUnit * 10000n;
      await addBiddingBalance(bidder1, wantedBalance);
      const balance = await luba.connect(bidder1).getPersonalBalance(bidder1Signature);
      expect(balance).to.equal(wantedBalance);
    });

    it("should allow withdrawing the balance of a bidder", async function () {
      const bidder1Signature = await signIn(bidder1, luba);

      const wantedBalance = biddingUnit * 10000n;
      await addBiddingBalance(bidder1, wantedBalance);
      await luba.connect(bidder1).withdrawBalance();
      const balance = await luba.connect(bidder1).getPersonalBalance(bidder1Signature);
      expect(balance).to.equal(0);
    });

    it("should subtract the balance when placing a bid", async function () {
      const bidder1Signature = await signIn(bidder1, luba);

      const wantedBalance = biddingUnit * 10000n;
      await addBiddingBalance(bidder1, wantedBalance);
      await luba.connect(bidder1).placeBid(auctionId, 11n);
      const balance = await luba.connect(bidder1).getPersonalBalance(bidder1Signature);
      expect(balance).to.equal(wantedBalance - 11n * biddingUnit);
    });
  });
});

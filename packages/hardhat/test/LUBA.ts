import { expect } from "chai";
import { ethers } from "hardhat";
import { LUBA, USDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";

describe("LUBA Contract", function () {
  let luba: LUBA;
  let usdc: USDC;
  const biddingUnit = ethers.parseEther("0.01");
  let owner: HardhatEthersSigner;
  let bidder1: HardhatEthersSigner;
  let bidder2: HardhatEthersSigner;

  before(async () => {
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
    it("should allow creating an auction", async function () {
      const futureTime = (await time.latest()) + 3600; // 1 hour from now
      await expect(luba.startAuction(futureTime, biddingUnit))
        .to.emit(luba, "AuctionCreated")
        .withArgs(0, owner.address, futureTime, biddingUnit);
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

    it("should place duplicate bids", async function () {
      await addBiddingBalance(bidder1, biddingUnit * 10000n);
      await addBiddingBalance(bidder2, biddingUnit * 10000n);

      await luba.connect(bidder1).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 11n);

      const bidsCount = await luba.readBidsCount(auctionId);
      expect(bidsCount).to.equal(2);

      const bids = await luba.connect(bidder1).readYourBids(auctionId);
      expect(bids.length).to.equal(1);
      expect(bids[0].bidder).to.equal(bidder1.address);
      expect(bids[0].amount).to.equal(11n * biddingUnit);

      const bids2 = await luba.connect(bidder2).readYourBids(auctionId);
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

    describe("Bid Reading", function () {
      let auctionId: number;

      beforeEach(async function () {
        auctionId = await createAuction();
      });

      it("should allow reading your own bids", async function () {
        await luba.connect(bidder1).placeBid(auctionId, 11n);
        await luba.connect(bidder1).placeBid(auctionId, 22n);

        await luba.connect(bidder2).placeBid(auctionId, 22n);

        const bids = await luba.connect(bidder1).readYourBids(auctionId);
        expect(bids.length).to.equal(2);
        expect(bids[0].amount).to.equal(11n * biddingUnit);
        expect(bids[1].amount).to.equal(22n * biddingUnit);
      });
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

      const winningBid = await luba.getWinningBid(auctionId);
      expect(winningBid.amount).to.equal(11n * biddingUnit);
      expect(winningBid.bidder).to.equal(bidder1.address);
    });

    it("should return the winning bid only if the auction has ended", async function () {
      await addBiddingBalance(bidder1, biddingUnit * 10000n);
      await addBiddingBalance(bidder2, biddingUnit * 10000n);

      await luba.connect(bidder1).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 11n);
      await luba.connect(bidder2).placeBid(auctionId, 22n);

      const winningBid = luba.getWinningBid(auctionId);
      await expect(winningBid).to.be.revertedWith("Auction has not ended yet");
    });
  });
});

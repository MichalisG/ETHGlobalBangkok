import { expect } from "chai";
import { ethers } from "hardhat";
import { LUBA } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";

describe("LUBA Contract", function () {
  let luba: LUBA;
  let owner: HardhatEthersSigner;
  let bidder1: HardhatEthersSigner;
  let bidder2: HardhatEthersSigner;

  before(async () => {
    [owner, bidder1, bidder2] = await ethers.getSigners();
    const lubaFactory = await ethers.getContractFactory("LUBA");
    luba = (await lubaFactory.deploy()) as LUBA;
    await luba.waitForDeployment();
  });

  const createAuction = async (endIn = 3600) => {
    const endTime = (await time.latest()) + endIn;
    await (await luba.startAuction(endTime)).wait();

    const logs = await luba.queryFilter(luba.getEvent("AuctionCreated"), 0, "latest");
    const latestAuctionId = logs.sort((a, b) => a.blockNumber - b.blockNumber)[logs.length - 1].args.auctionId;

    if (latestAuctionId === undefined) {
      throw new Error("AuctionId not found");
    }

    return Number(latestAuctionId);
  };

  describe("Auction Creation", function () {
    it("should allow creating an auction", async function () {
      const futureTime = (await time.latest()) + 3600; // 1 hour from now
      await expect(luba.startAuction(futureTime))
        .to.emit(luba, "AuctionCreated")
        .withArgs(0, owner.address, futureTime);
    });
  });

  describe("Bidding", function () {
    let auctionId: number;

    beforeEach(async function () {
      auctionId = await createAuction();
    });

    it("should accept valid bids", async function () {
      await expect(luba.connect(bidder1).placeBid(auctionId, ethers.parseEther("1")))
        .to.emit(luba, "BidPlaced")
        .withArgs(auctionId, bidder1.address);
    });

    it("should reject bids with more than 2 decimals", async function () {
      await expect(luba.connect(bidder1).placeBid(auctionId, ethers.parseEther("1.551"))).to.be.revertedWith(
        "Amount can only have 2 decimal places",
      );
      await expect(luba.connect(bidder1).placeBid(auctionId, ethers.parseEther("1.5555"))).to.be.revertedWith(
        "Amount can only have 2 decimal places",
      );
    });

    it("should place duplicate bids", async function () {
      await luba.connect(bidder1).placeBid(auctionId, ethers.parseEther("1.1"));
      await luba.connect(bidder2).placeBid(auctionId, ethers.parseEther("1.1"));

      const bidsCount = await luba.readBidsCount(auctionId);
      expect(bidsCount).to.equal(2);

      const bids = await luba.connect(bidder1).readYourBids(auctionId);
      expect(bids.length).to.equal(1);
      expect(bids[0].bidder).to.equal(bidder1.address);
      expect(bids[0].amount).to.equal(ethers.parseEther("1.1"));

      const bids2 = await luba.connect(bidder2).readYourBids(auctionId);
      expect(bids2.length).to.equal(1);
      expect(bids2[0].bidder).to.equal(bidder2.address);
      expect(bids2[0].amount).to.equal(ethers.parseEther("1.1"));
    });

    it("should not allow placing bids after the auction has ended", async function () {
      await hre.network.provider.send("evm_increaseTime", [1_000_000]);
      await hre.network.provider.send("evm_mine", []);

      await expect(luba.connect(bidder1).placeBid(auctionId, ethers.parseEther("1.1"))).to.be.revertedWith("Auction has ended or not existing");
    });

    describe("Bid Reading", function () {
      let auctionId: number;

      beforeEach(async function () {
        auctionId = await createAuction();
      });

      it("should allow reading your own bids", async function () {
        await luba.connect(bidder1).placeBid(auctionId, ethers.parseEther("1.1"));
        await luba.connect(bidder1).placeBid(auctionId, ethers.parseEther("2.2"));

        await luba.connect(bidder2).placeBid(auctionId, ethers.parseEther("2.2"));

        const bids = await luba.connect(bidder1).readYourBids(auctionId);
        expect(bids.length).to.equal(2);
        expect(bids[0].amount).to.equal(ethers.parseEther("1.1"));
        expect(bids[1].amount).to.equal(ethers.parseEther("2.2"));
      });
    });
  });

  describe("Winning Bid", function () {
    let auctionId: number;

    beforeEach(async function () {
      auctionId = await createAuction();
    });

    it("should return the winning bid", async function () {
      await luba.connect(bidder1).placeBid(auctionId, ethers.parseEther("1.1"));
      await luba.connect(bidder2).placeBid(auctionId, ethers.parseEther("1.1"));
      await luba.connect(bidder2).placeBid(auctionId, ethers.parseEther("2.2"));

      await hre.network.provider.send("evm_increaseTime", [1_000_000]);
      await hre.network.provider.send("evm_mine", []);

      const winningBid = await luba.getWinningBid(auctionId);
      expect(winningBid.amount).to.equal(ethers.parseEther("1.1"));
      expect(winningBid.bidder).to.equal(bidder1.address);
    });

    it("should return the winning bid only if the auction has ended", async function () {
      await luba.connect(bidder1).placeBid(auctionId, ethers.parseEther("1.1"));
      await luba.connect(bidder2).placeBid(auctionId, ethers.parseEther("1.1"));
      await luba.connect(bidder2).placeBid(auctionId, ethers.parseEther("2.2"));

      const winningBid = luba.getWinningBid(auctionId);
      await expect(winningBid).to.be.revertedWith("Auction has not ended yet");
    });
  });
});

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// this is a LUBA (Lowest Unique Bid Auction).

// it is a simple auction where the lowest unique (or first) bid is the winner.

contract LUBA {
  IERC20 public bidToken;

  struct Bid {
    uint256 amount;
    address bidder;
  }

  struct Auction {
    address creator;
    uint256 endTime;
    Bid[] bids;
    mapping(address => uint256[]) bidsByBidder;
    uint256 currentLowestBidIndex;
    uint256 totalBidAmount;
    bool withdrawn;
  }

  event AuctionCreated(
    uint256 indexed auctionId,
    address indexed creator,
    uint256 endTime
  );

  event BidPlaced(
    uint256 indexed auctionId,
    address indexed bidder
  );

  Auction[] public auctions;

  // only the creator can start an auction
  modifier onlyUpTo2Decimals(uint256 amount) {
    require(amount > 0, "Amount must be greater than 0");
    require(amount / 10 ** 16 * 10 ** 16 == amount, "Amount can only have 2 decimal places");
    _;
  }

  constructor(address _bidToken) {
    bidToken = IERC20(_bidToken);
  }

  function startAuction(uint256 endTime) public {
    auctions.push();
    uint256 newAuctionId = auctions.length - 1;
    Auction storage newAuction = auctions[newAuctionId];

    newAuction.creator = msg.sender;
    newAuction.endTime = endTime;
    newAuction.withdrawn = false;

    emit AuctionCreated(newAuctionId, msg.sender, endTime);
  }

  function placeBid(uint256 auctionId, uint256 amount) public onlyUpTo2Decimals(amount) {
    require(auctions[auctionId].endTime > block.timestamp, "Auction has ended or not existing");

    Auction storage auction = auctions[auctionId];

    // Transfer tokens from bidder to contract
    require(bidToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

    // Update total bid amount
    auction.totalBidAmount += amount;

    // store always any valid bid
    auction.bids.push(Bid(amount, msg.sender));

    auction.bidsByBidder[msg.sender].push(auction.bids.length - 1); // store the index of the bid

    // update the current lowest bid index if the new bid is lower
    Bid memory currentLowestBid = auction.bids[auction.currentLowestBidIndex];
    if (amount < currentLowestBid.amount || currentLowestBid.amount == 0) {
      auction.currentLowestBidIndex = auction.bids.length - 1;
    }

    emit BidPlaced(auctionId, msg.sender);
  }

  // for now ignore, we might not need this
  // function readBid(uint256 auctionId, uint256 bidId) public view returns (Bid memory) {
  //   Bid memory bid = auctions[auctionId].bids[bidId];

  //   require(bid.bidder == msg.sender, "You did not place this bid");

  //   return bid;
  // }

  function readYourBids(uint256 auctionId) public view returns (Bid[] memory) {
    uint256[] memory bidIds = auctions[auctionId].bidsByBidder[msg.sender];

    Bid[] memory bids = new Bid[](bidIds.length);
    for (uint256 i = 0; i < bidIds.length; i++) {
      bids[i] = auctions[auctionId].bids[bidIds[i]];
    }
    return bids;
  }

  function readBidsCount(uint256 auctionId) public view returns (uint256) {
    return auctions[auctionId].bids.length;
  }

  function getWinningBid(uint256 auctionId) public view returns (Bid memory) {
    require(auctions[auctionId].endTime < block.timestamp, "Auction has not ended yet");

    return auctions[auctionId].bids[auctions[auctionId].currentLowestBidIndex];
  }

  // New function to withdraw tokens after auction ends
  function withdrawTokens(uint256 auctionId) public {
    Auction storage auction = auctions[auctionId];
    require(msg.sender == auction.creator, "Only auction creator can withdraw");
    require(auction.endTime < block.timestamp, "Auction has not ended yet");
    require(!auction.withdrawn, "Tokens already withdrawn");

    auction.withdrawn = true;
    require(bidToken.transfer(auction.creator, auction.totalBidAmount), "Token transfer failed");
  }
}

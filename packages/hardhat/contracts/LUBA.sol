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
    uint256 biddingUnit; // the smallest amount that can be bid. every bid must be a multiple of this amount.
    Bid[]bids;
    mapping(address => uint256[]) bidsByBidder;
    uint256 totalBidAmount;
    bool withdrawn;
  }

  mapping(address => uint256) public userBalances;

  event AuctionCreated(
    uint256 indexed auctionId,
    address indexed creator,
    uint256 endTime,
    uint256 biddingUnit
  );

  event BidPlaced(
    uint256 indexed auctionId,
    address indexed bidder
  );

  Auction[] public auctions;

  constructor(address _bidToken) {
    bidToken = IERC20(_bidToken);
  }

  function startAuction(uint256 endTime, uint256 biddingUnit) public {
    require(endTime > block.timestamp, "End time must be in the future");
    require(biddingUnit > 0, "Bidding unit must be greater than 0");

    auctions.push();
    uint256 newAuctionId = auctions.length - 1;
    Auction storage newAuction = auctions[newAuctionId];

    newAuction.creator = msg.sender;
    newAuction.endTime = endTime;
    newAuction.biddingUnit = biddingUnit;
    newAuction.withdrawn = false;

    emit AuctionCreated(newAuctionId, msg.sender, endTime, biddingUnit);
  }

  function placeBid(uint256 auctionId, uint256 multiplier) public {
    require(auctions[auctionId].endTime > block.timestamp, "Auction has ended or not existing");
    uint256 amount = multiplier * auctions[auctionId].biddingUnit;

    Auction storage auction = auctions[auctionId];

    // Update total bid amount
    auction.totalBidAmount += amount;

    // store always any valid bid
    auction.bids.push(Bid(amount, msg.sender));

    auction.bidsByBidder[msg.sender].push(auction.bids.length - 1); // store the index of the bid

    emit BidPlaced(auctionId, msg.sender);
  }

  function readYourBids(uint256 auctionId) public view returns (Bid[] memory) {
    uint256[] memory bidIds = auctions[auctionId].bidsByBidder[msg.sender];

    Bid[] memory bids = new Bid[](bidIds.length);
    for (uint256 i = 0; i < bidIds.length; i++) {
      bids[i] = auctions[auctionId].bids[bidIds[i]];
    }
    return bids;
  }

  function revealBids(uint256 auctionId) public view returns (Bid[] memory) {
    require(auctions[auctionId].endTime < block.timestamp, "Auction has not ended yet");

    return auctions[auctionId].bids;
  }

  // New function to withdraw tokens after auction ends
  function withdrawBidPool(uint256 auctionId) public {
    Auction storage auction = auctions[auctionId];
    require(msg.sender == auction.creator, "Only auction creator can withdraw");
    require(auction.endTime < block.timestamp, "Auction has not ended yet");
    require(!auction.withdrawn, "Tokens already withdrawn");

    auction.withdrawn = true;
    require(bidToken.transfer(auction.creator, auction.totalBidAmount), "Token transfer failed");
  }

  function addBalance(uint256 amount) public {
    require(amount > 0, "Amount must be greater than 0");
    bidToken.transferFrom(msg.sender, address(this), amount);

    userBalances[msg.sender] += amount;
  }

  function withdrawBalance() public {
    require(userBalances[msg.sender] > 0, "No balance to withdraw");

    bidToken.transfer(msg.sender, userBalances[msg.sender]);
    userBalances[msg.sender] = 0;
  }

  function getPersonalBalance() public view returns (uint256) {
    return userBalances[msg.sender];
  }

  function auctionsLength() public view returns (uint256) {
    return auctions.length;
  }

  function getPublicAuctionData(uint256 auctionId) public view returns (
    uint256 endTime,
    uint256 biddingUnit,
    uint256 bidsCount
  ) {
    Auction storage auction = auctions[auctionId];

    return (auction.endTime, auction.biddingUnit, auction.bids.length);
  }

  function getCreatorAuctionData(uint256 auctionId) public view returns (
    uint256 totalBidAmount,
    uint256 numberOfBids,
    bool withdrawn
  ) {
    require(msg.sender == auctions[auctionId].creator, "Only auction creator can access this data");

    Auction storage auction = auctions[auctionId];

    return (auction.totalBidAmount, auction.bids.length, auction.withdrawn);
  }
}

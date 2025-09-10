export interface HoldBidDto {
  input: {
    storeId: string;
    positionId: string;
    bidAmount: number;
    bidId: string;
  };
}

export interface FinalizeAuctionDto {
  input: {
    bidId: string;
  };
}

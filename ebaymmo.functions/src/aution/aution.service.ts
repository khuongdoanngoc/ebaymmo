import { Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlSdk, InjectSdk } from 'src/sdk/sdk.module';
@Injectable()
export class AuctionService {
  constructor(@InjectSdk() private readonly sdk: GqlSdk) {}

  async placeBid(storeId: string, positionId: string, bidAmount: number, bidId: string) {
    console.log('Input data:', positionId, storeId, bidAmount, bidId); // Debug log

    // Đảm bảo tất cả giá trị đều được truyền vào
    if (!storeId || !positionId || !bidAmount || !bidId) {
      throw new UnauthorizedException('Missing required parameters');
    }

    const result = await this.sdk.HoldBidAmount({
      p_store_id: storeId,
      p_position_id: positionId,
      p_bid_amount: bidAmount,
      p_bid_id: bidId,
    });
    //console.log("result", result);

    // Lấy kết quả đầu tiên từ array
    const bidHistory = result.holdBidAmount[0];

    // Trả về đúng format mà Hasura action mong đợi
    //console.log("bidHistory", bidHistory)
    return bidHistory;
  }

  async finalizeAuction(bidId: string) {
    //console.log('Input data:', bidId);  // Debug log
    const result = await this.sdk.finalizeBidAution({
      p_bid_id: bidId,
    });

    const bidHistory = result.finalizeBidAution[0];
    //console.log('Result:', bidHistory);
    return bidHistory;
  }
}

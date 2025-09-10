import { Controller, Post, Body } from '@nestjs/common';
import { AuctionService } from './aution.service';
import { HasuraActionsPayload } from '../types';
import { FinalizeAuctionDto, HoldBidDto } from '../types/auction.types';

@Controller('auction')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Post('hold-bid')
  async holdBid(@Body() body: HasuraActionsPayload<HoldBidDto>) {
    // console.log(body.input.input);
    const { storeId, positionId, bidAmount, bidId } = body.input.input;
    const result = await this.auctionService.placeBid(storeId, positionId, bidAmount, bidId);
    return result;
  }

  @Post('finalize-bid')
  async finalizeAuction(@Body() body: HasuraActionsPayload<FinalizeAuctionDto>) {
    // console.log(body.input.input);
    const { bidId } = body.input.input;
    const result = await this.auctionService.finalizeAuction(bidId);
    return result;
  }
}

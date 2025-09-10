import { Module } from '@nestjs/common';
import { AuctionService } from './aution.service';
import { SdkModule } from 'src/sdk/sdk.module';
import { AuctionController } from './aution.controller';
@Module({
  imports: [SdkModule],
  controllers: [AuctionController],
  providers: [AuctionService],
})
export class AuctionModule {}

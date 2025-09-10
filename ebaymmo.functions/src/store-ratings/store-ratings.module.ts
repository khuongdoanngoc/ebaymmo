import { Module } from '@nestjs/common';
import { StoreRatingsService } from './store-ratings.service';
import { StoresModule } from 'src/stores/stores.module';
import { StoreRatingsController } from './store-ratings.controller';
import { SdkModule } from 'src/sdk/sdk.module';

@Module({
  imports: [StoresModule, SdkModule],
  controllers: [StoreRatingsController],
  providers: [StoreRatingsService],
})
export class StoreRatingsModule {}

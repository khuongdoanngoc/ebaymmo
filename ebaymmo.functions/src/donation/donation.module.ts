import { Module } from '@nestjs/common';
import { SdkModule } from 'src/sdk/sdk.module';
import { DonationsService } from './donation.service';
import { DonationsController } from './donation.controller';

@Module({
  imports: [SdkModule],
  controllers: [DonationsController],
  providers: [DonationsService],
})
export class DonationModule {}

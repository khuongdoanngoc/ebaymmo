import { Module } from '@nestjs/common';
import { AddressBalanceController } from './address-balance.controller';
import { AddressBalanceService } from './address-balance.service';
import { SdkModule } from '../sdk/sdk.module';

@Module({
  imports: [SdkModule],
  controllers: [AddressBalanceController],
  providers: [AddressBalanceService],
})
export class AddressBalanceModule {}

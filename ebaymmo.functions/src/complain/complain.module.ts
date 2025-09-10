import { Module } from '@nestjs/common';
import { ComplainService } from './complain.service';
import { ComplainController } from './complain.controller';
import { SdkModule } from 'src/sdk/sdk.module';
import { OrderModule } from 'src/order/order.module';

@Module({
  imports: [OrderModule, SdkModule],
  providers: [ComplainService],
  controllers: [ComplainController],
})
export class ComplainModule {}

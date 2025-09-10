import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { ConfigModule } from '@nestjs/config';
import { SdkModule } from '../sdk/sdk.module';

@Module({
  imports: [ConfigModule, SdkModule],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}

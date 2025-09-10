import { HasuraModule } from '@golevelup/nestjs-hasura';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppLogger } from './logger.service';
import { LoggingInterceptor } from './logging.interceptor';
import { SdkModule } from './sdk/sdk.module';
import { AuthModule } from 'src/auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { StoreRatingsModule } from './store-ratings/store-ratings.module';
import { S3Module } from './s3/s3.module';
import { OrderModule } from './order/order.module';
import { ComplainModule } from './complain/complain.module';
import { WithdrawalModule } from './withdrawal/withdrawal.module';
import { AuctionModule } from './aution/aution.module';
import { DonationModule } from './donation/donation.module';
import { AddressBalanceModule } from './address-balance/address-balance.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    SdkModule,
    AuthModule,
    S3Module,
    StoresModule,
    StoreRatingsModule,
    ScheduleModule.forRoot(),
    HasuraModule.forRootAsync(HasuraModule, {
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const webhookSecret = configService.get<string>('NESTJS_EVENT_WEBHOOK_SHARED_SECRET');

        const environment = configService.get<string | undefined>('NODE_ENV');

        return {
          webhookConfig: {
            secretFactory: webhookSecret,
            secretHeader: 'nestjs-event-webhook',
          },
          managedMetaDataConfig:
            environment === undefined || environment === 'development'
              ? {
                  metadataVersion: 'v3',
                  dirPath: join(process.cwd(), 'hasura/metadata'),
                  nestEndpointEnvName: 'NESTJS_EVENT_WEBHOOK_ENDPOINT',
                  secretHeaderEnvName: 'NESTJS_EVENT_WEBHOOK_SHARED_SECRET',
                  defaultEventRetryConfig: {
                    numRetries: 3,
                    timeoutInSeconds: 100,
                    intervalInSeconds: 30,
                    toleranceSeconds: 21600,
                  },
                }
              : undefined,
        };
      },
    }),
    OrderModule,
    ComplainModule,
    WithdrawalModule,
    AuctionModule,
    DonationModule,
    AddressBalanceModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [
    AppLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}

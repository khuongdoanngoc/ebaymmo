import { HasuraModule } from '@golevelup/nestjs-hasura';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AppController } from './app.controller';
import { ConfigModule } from './common/config/config.module';
import { AppLogger } from './logger.service';
import { LoggingInterceptor } from './logging.interceptor';
import { SdkModule } from './sdk/sdk.module';
import { ElasticSearchModule } from './elasticsearch/elasticsearch.module';
import { ElasticSearchBlogModule } from './elasticsearch-blog/elasticsearch-blog.module';
import { ElasticsearchPositionModule } from './elasticsearch-position/elasticsearch-position.module';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    HttpModule,
    SdkModule,
    ScheduleModule.forRoot(),
    ConfigModule,
    HasuraModule.forRootAsync({
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
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        ttl: 300,
      }),
    }),
    ElasticSearchModule,
    ElasticSearchBlogModule,
    ElasticsearchPositionModule,
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

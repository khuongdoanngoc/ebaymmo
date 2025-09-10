import { Module } from '@nestjs/common';
import { ElasticSearchService } from './elasticsearch.service';
import { ElasticSearchController } from './elasticsearch.controller';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { SdkModule } from 'src/sdk/sdk.module';
import { JwtModule } from '@nestjs/jwt';
import { ElasticSearchSyncService } from './sync.service';
import { ElasticSearchBlogModule } from 'src/elasticsearch-blog/elasticsearch-blog.module';
import { ElasticsearchPositionModule } from 'src/elasticsearch-position/elasticsearch-position.module';
import { RateLimitService } from './rate-limit.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        node: `http://${configService.get('ELASTICSEARCH_IP')}:${configService.get('ELASTICSEARCH_PORT')}`,
      }),
    }),
    SdkModule,
    JwtModule.register({
      secret: process.env.HASURA_GRAPHQL_JWT_SECRET,
    }),
    ElasticSearchBlogModule,
    ElasticsearchPositionModule,
    CacheModule.register({
      ttl: 60000,
    }),
  ],
  providers: [ElasticSearchService, ElasticSearchSyncService, RateLimitService],
  controllers: [ElasticSearchController],
  exports: [ElasticSearchService, ElasticSearchSyncService],
})
export class ElasticSearchModule {}

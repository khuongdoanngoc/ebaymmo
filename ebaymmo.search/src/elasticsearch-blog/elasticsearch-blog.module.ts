import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { SdkModule } from 'src/sdk/sdk.module';
import { JwtModule } from '@nestjs/jwt';
import { ElasticSearchBlogController } from './elasticsearch-blog.controller';
import { ElasticSearchBlogService } from './elasticsearch-blog.service';

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
  ],
  providers: [ElasticSearchBlogService],
  controllers: [ElasticSearchBlogController],
  exports: [ElasticSearchBlogService],
})
export class ElasticSearchBlogModule {}

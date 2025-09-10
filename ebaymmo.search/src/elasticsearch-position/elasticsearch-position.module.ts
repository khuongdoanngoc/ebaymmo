import { Module } from '@nestjs/common';
import { ElasticsearchPositionController } from './elasticsearch-position.controller';
import { ElasticSearchPositionService } from './elasticsearch-position.service';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        node: `http://${configService.get('ELASTICSEARCH_IP')}:${configService.get('ELASTICSEARCH_PORT')}`,
      }),
    }),
    JwtModule.register({
      secret: process.env.HASURA_GRAPHQL_JWT_SECRET,
    }),
  ],
  controllers: [ElasticsearchPositionController],
  providers: [ElasticSearchPositionService],
  exports: [ElasticSearchPositionService],
})
export class ElasticsearchPositionModule {}

import {
  Controller,
  Post,
  Body,
  Get,
  ValidationPipe,
  Query,
  UseGuards,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { ElasticSearchService } from './elasticsearch.service';
import { SearchStoreDto } from './dto/search-store.dto';
import { CreateSearchHistoryDto } from './dto/search-history.dto';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/user-id.decorator';
import { HasuraWebhookGuard } from 'src/common/guards/hasura-webhook.guard';
import { Request } from 'express';

@Controller('elasticsearch-sync')
export class ElasticSearchController {
  constructor(private readonly elasticSearchService: ElasticSearchService) {}

  @Post('store')
  @UseGuards(HasuraWebhookGuard)
  async handleStoreEvent(@Body() eventPayload: any) {
    const { event } = eventPayload;
    const { op, data } = event;
    try {
      switch (op) {
        case 'INSERT':
          await this.elasticSearchService.addStore(data.new);
          break;
        case 'UPDATE':
          await this.elasticSearchService.updateStore(data.new);
          break;
        case 'DELETE':
          await this.elasticSearchService.deleteStore(event.data.old.store_id);
          break;
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('search')
  async searchStores(@Query(new ValidationPipe({ transform: true })) searchDto: SearchStoreDto) {
    return this.elasticSearchService.searchStore(searchDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('search-history')
  async createSearchHistory(
    @UserId() userId: string,
    @Body() createSearchHistoryDto: CreateSearchHistoryDto,
    @Req() request: Request,
  ) {
    const ip = request.ip || request.socket.remoteAddress;
    return this.elasticSearchService.saveSearchHistory(userId, createSearchHistoryDto.content, ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search-history')
  async getSearchHistory(@UserId() userId: string) {
    return this.elasticSearchService.getSearchHistory(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('search-history/:historyId')
  async deleteSearchHistory(@UserId() userId: string, @Param('historyId') historyId: string) {
    return this.elasticSearchService.deleteSearchHistory(userId, historyId);
  }

  @Get('search-suggestions')
  async getPublicSearchSuggestions(@Query('query') query: string, @Query('limit') limit?: number) {
    return this.elasticSearchService.getSearchSuggestions(query, undefined, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-search-suggestions')
  async getUserSearchSuggestions(
    @UserId() userId: string,
    @Query('query') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.elasticSearchService.getSearchSuggestions(query, userId, limit);
  }

  @Get('search-stats/top3')
  async getTopThreeSearchStats() {
    return this.elasticSearchService.getTopSearchStats();
  }
}

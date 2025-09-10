import { Controller, Post, Body, UseGuards, Get, Query, ValidationPipe } from '@nestjs/common';
import { GostWebhookGuard } from 'src/common/guards/gost-webhook.guard';
import { ElasticSearchBlogService } from './elasticsearch-blog.service';
import { SearchBlogDto } from './dto/search-blog.dto';

@Controller('elasticsearch-blog')
export class ElasticSearchBlogController {
  constructor(private readonly elasticSearchBlogService: ElasticSearchBlogService) {}

  @Post('blog-create')
  @UseGuards(GostWebhookGuard)
  async handleBlogsEvent(@Body() eventPayload: any) {
    const { post } = eventPayload;
    await this.elasticSearchBlogService.createBlog(post.current);
    console.log('Blog created');
    return { success: true };
  }

  @Post('blog-update')
  @UseGuards(GostWebhookGuard)
  async handleBlogsUpdateEvent(@Body() eventPayload: any) {
    const { post } = eventPayload;
    await this.elasticSearchBlogService.updateBlog(post.current);
    return { success: true };
  }

  @Post('blog-delete')
  @UseGuards(GostWebhookGuard)
  async handleBlogsDeleteEvent(@Body() eventPayload: any) {
    const { post } = eventPayload;
    await this.elasticSearchBlogService.deleteBlog(post.previous.uuid);
    return { success: true };
  }

  @Get('search')
  async searchBlogs(@Query(new ValidationPipe({ transform: true })) searchDto: SearchBlogDto) {
    const { query, tags, page, limit } = searchDto;
    return this.elasticSearchBlogService.searchBlogs(query || '', tags, page, limit);
  }
}

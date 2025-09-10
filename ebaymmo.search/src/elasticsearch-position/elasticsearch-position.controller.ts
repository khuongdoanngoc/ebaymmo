import { Body, Controller, Post } from '@nestjs/common';
import { ElasticSearchPositionService } from './elasticsearch-position.service';

@Controller('elasticsearch-position')
export class ElasticsearchPositionController {
  constructor(private readonly elasticsearchPositionService: ElasticSearchPositionService) {}
  @Post('update')
  async handleStoreEvent(@Body() eventPayload: any) {
    const { event } = eventPayload;
    const { op, data } = event;
    try {
      switch (op) {
        case 'INSERT':
          await this.elasticsearchPositionService.createPosition(data.new);
          break;
        case 'UPDATE':
          await this.elasticsearchPositionService.updatePosition(data.new);
          break;
        case 'DELETE':
          await this.elasticsearchPositionService.deletePosition(event.data.old.position_id);
          break;
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

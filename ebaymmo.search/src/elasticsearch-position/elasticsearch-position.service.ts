import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { POSITION_MAPPING } from 'src/common/constrant/constrant';
import { PositionDocument } from 'src/types/elastichsearch_document/document.type';
import { createPositionDocument } from 'src/utils/create-document';

@Injectable()
export class ElasticSearchPositionService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {
    this.initializeIndices();
  }

  private async initializeIndices() {
    try {
      await this.elasticsearchService.ping();
      // Check and create 'positions' index
      const positionsExists = await this.elasticsearchService.indices.exists({
        index: 'positions',
      });

      if (!positionsExists) {
        await this.elasticsearchService.indices.create({
          index: 'positions',
          body: {
            mappings: {
              properties: POSITION_MAPPING,
            },
          },
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async createPosition(position: any) {
    try {
      const document = createPositionDocument(position);
      const result = await this.elasticsearchService.index({
        index: 'positions',
        id: document.positionId.toString(),
        body: document,
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async updatePosition(position: any) {
    try {
      const result = await this.elasticsearchService.update({
        index: 'positions',
        id: position.position_id,
        body: {
          doc: {
            winnerStores: position.winner_stores,
            status: position.status,
          },
        },
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async deletePosition(positionId: string) {
    try {
      const result = await this.elasticsearchService.delete({
        index: 'positions',
        id: positionId,
        refresh: true,
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getPositionsByCategory(categorySlug: string) {
    try {
      const result = await this.elasticsearchService.search({
        index: 'positions',
        body: {
          query: {
            term: {
              'categorySlug.keyword': categorySlug,
            },
          },
          sort: [{ position: { order: 'asc' } }],
        },
      });
      return result.hits.hits
        .map(hit => (hit._source as PositionDocument).winnerStores)
        .filter(Boolean);
    } catch (error) {
      throw error;
    }
  }

  async getPositionsByType(type: string) {
    try {
      const result = await this.elasticsearchService.search({
        index: 'positions',
        body: {
          query: {
            term: {
              'type.keyword': type,
            },
          },
          sort: [{ position: { order: 'asc' } }],
        },
      });
      return result.hits.hits
        .map(hit => (hit._source as PositionDocument).winnerStores)
        .filter(Boolean);
    } catch (error) {
      throw error;
    }
  }
}

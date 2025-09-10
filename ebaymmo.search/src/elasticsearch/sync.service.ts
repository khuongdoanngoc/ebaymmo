import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { GqlSdk, InjectSdk } from 'src/sdk/sdk.module';
import axios from 'axios';
import {
  createBlogDocument,
  createPositionDocument,
  createStoreDocument,
} from '../utils/create-document';
import { BLOG_MAPPING, POSITION_MAPPING, STORE_MAPPING } from 'src/common/constrant/constrant';

@Injectable()
export class ElasticSearchSyncService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    @InjectSdk() private sdk: GqlSdk,
  ) {}

  async onModuleInit() {
    await this.waitForElasticsearchConnection();
    await this.syncStoresData();
    await this.syncBlogsData();
    await this.syncPositionData();
  }

  private async waitForElasticsearchConnection(maxRetries = 10, retryDelay = 5000) {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        console.log(`Checking Elasticsearch connection (attempt ${retries + 1}/${maxRetries})...`);
        const health = await this.elasticsearchService.cluster.health();
        console.log(`Elasticsearch cluster status: ${health.status}`);

        // Connection successful
        return true;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          console.error('Failed to connect to Elasticsearch after maximum retries:', error);
          throw new Error('Could not connect to Elasticsearch');
        }
        console.log(`Elasticsearch not ready, retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  private async ensureIndexExists(indexName: string, mappings?: any) {
    try {
      const indexExists = await this.elasticsearchService.indices.exists({
        index: indexName,
      });

      if (!indexExists) {
        if (mappings) {
          await this.elasticsearchService.indices.create({
            index: indexName,
            body: {
              mappings: {
                properties: mappings,
              },
            },
          });
        } else {
          await this.elasticsearchService.indices.create({
            index: indexName,
          });
        }
      }
    } catch (error) {
      console.error(`Error ensuring index ${indexName} exists:`, error);
    }
  }

  async syncStoresData() {
    try {
      await this.ensureIndexExists('stores', STORE_MAPPING);

      const BATCH_SIZE = 100;
      let offset = 0;
      let hasMore = true;
      const bulkOperations = [];

      // Lấy dữ liệu theo từng trang
      while (hasMore) {
        try {
          const response = await this.sdk.GetAllStoresAsync({
            where: {
              _and: [{ storeId: { _isNull: false } }],
            },
            offset: offset,
            limit: BATCH_SIZE,
          });

          const stores = response.stores;

          if (stores.length === 0) {
            hasMore = false;
            break;
          }

          // Xử lý từng store và thêm vào bulkOperations
          for (const store of stores) {
            if (!store.storeId) {
              continue;
            }

            try {
              bulkOperations.push(
                { update: { _index: 'stores', _id: store.storeId.toString() } },
                {
                  doc: createStoreDocument(store),
                  doc_as_upsert: true,
                },
              );
            } catch (docError) {
              console.error('Error preparing store document:', docError);
            }
          }

          if (bulkOperations.length >= 200) {
            await this.processBulkOperations(bulkOperations);
            bulkOperations.length = 0; // Reset array
          }

          offset += BATCH_SIZE;
        } catch (fetchError) {
          console.error('Error fetching stores batch:', fetchError);
          hasMore = false;
        }
      }

      // Xử lý các operations còn lại
      if (bulkOperations.length > 0) {
        await this.processBulkOperations(bulkOperations);
      }

      console.log('sync stores data done!');
    } catch (error) {
      console.error('Error syncing stores data:', error);
    }
  }

  async syncBlogsData() {
    try {
      await this.ensureIndexExists('blogs', BLOG_MAPPING);

      const BATCH_SIZE = 100;
      let offset = 0;
      let hasMore = true;
      const bulkOperations = [];

      while (hasMore) {
        try {
          const response = await axios.get(
            `${process.env.BLOG_API_URL}/content/posts/?key=${process.env.GOST_API_KEY}&include=tags&limit=${BATCH_SIZE}&page=${offset}`,
          );
          const blogs = response.data.posts;

          if (blogs.length === 0) {
            hasMore = false;
            break;
          }

          for (const blog of blogs) {
            if (!blog.uuid) {
              continue;
            }

            try {
              bulkOperations.push(
                { update: { _index: 'blogs', _id: blog.uuid } },
                {
                  doc: createBlogDocument(blog),
                  doc_as_upsert: true,
                },
              );
            } catch (docError) {
              console.error('Error preparing blog document:', docError);
            }
          }

          if (bulkOperations.length >= 200) {
            await this.processBulkOperations(bulkOperations);
            bulkOperations.length = 0;
          }

          offset += BATCH_SIZE;
        } catch (fetchError) {
          hasMore = false;
        }
      }

      if (bulkOperations.length > 0) {
        await this.processBulkOperations(bulkOperations);
      }

      console.log('sync blogs data done!');
    } catch (error) {
      console.error('Error syncing blogs data:', error);
    }
  }

  async syncPositionData() {
    try {
      await this.ensureIndexExists('positions', POSITION_MAPPING);

      const BATCH_SIZE = 100;
      let offset = 0;
      let hasMore = true;
      const bulkOperations = [];

      while (hasMore) {
        try {
          const response = await this.sdk.GetPositions({
            where: {
              categoryId: {
                _isNull: false,
              },
            },
            offset: offset,
            limit: BATCH_SIZE,
          });

          const positions = response.positions;

          if (positions.length === 0) {
            hasMore = false;
            break;
          }

          for (const position of positions) {
            const positionId = position.positionId?.toString();
            if (!positionId) {
              continue;
            }

            try {
              bulkOperations.push(
                { update: { _index: 'positions', _id: positionId } },
                {
                  doc: createPositionDocument(position),
                  doc_as_upsert: true,
                },
              );
            } catch (docError) {
              console.error('Error preparing position document:', docError);
            }
          }

          if (bulkOperations.length >= 200) {
            await this.processBulkOperations(bulkOperations);
            bulkOperations.length = 0;
          }

          offset += BATCH_SIZE;
        } catch (fetchError) {
          hasMore = false;
        }
      }

      if (bulkOperations.length > 0) {
        await this.processBulkOperations(bulkOperations);
      }

      console.log('sync positions data done!');
    } catch (error) {
      console.error('Error syncing positions data:', error);
    }
  }

  // Hàm helper để xử lý bulk operations
  private async processBulkOperations(operations: any[]) {
    try {
      await this.elasticsearchService.bulk({
        body: operations,
        refresh: true,
        timeout: '60s',
      });
    } catch (bulkError) {
      console.error('Error processing bulk operation:', bulkError);
    }
  }
}

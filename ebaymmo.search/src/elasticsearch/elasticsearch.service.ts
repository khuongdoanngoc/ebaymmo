import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  SearchHistoryDocument,
  SearchStatsDocument,
  StoreDocument,
} from 'src/types/elastichsearch_document/document.type';
import { GqlSdk } from 'src/sdk/sdk.module';
import { InjectSdk } from 'src/sdk/sdk.module';
import { ElasticSearchPositionService } from 'src/elasticsearch-position/elasticsearch-position.service';
import { RateLimitService } from './rate-limit.service';
import {
  SEARCH_HISTORY_MAPPING,
  SEARCH_STATS_MAPPING,
  STORE_MAPPING,
} from 'src/common/constrant/constrant';
import { createStoreDocument } from 'src/utils/create-document';

@Injectable()
export class ElasticSearchService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly elasticSearchPositionService: ElasticSearchPositionService,
    private readonly rateLimitService: RateLimitService,
    @InjectSdk() private sdk: GqlSdk,
  ) {
    this.initializeIndices();
  }

  private async initializeIndices() {
    try {
      await this.elasticsearchService.ping();

      const storesExists = await this.elasticsearchService.indices.exists({
        index: 'stores',
      });

      if (!storesExists) {
        await this.elasticsearchService.indices.create({
          index: 'stores',
          body: {
            mappings: {
              properties: STORE_MAPPING,
            },
          },
        });
      }

      // Check and create 'search-history' index
      const searchHistoryExists = await this.elasticsearchService.indices.exists({
        index: 'search-history',
      });

      if (!searchHistoryExists) {
        await this.elasticsearchService.indices.create({
          index: 'search-history',
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              'index.routing.allocation.enable': 'all',
            },
            mappings: {
              properties: SEARCH_HISTORY_MAPPING,
            },
          },
        });
      }

      // Check and create 'search-stats' index
      const searchStatsExists = await this.elasticsearchService.indices.exists({
        index: 'search-stats',
      });

      if (!searchStatsExists) {
        await this.elasticsearchService.indices.create({
          index: 'search-stats',
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              'index.routing.allocation.enable': 'all',
            },
            mappings: {
              properties: SEARCH_STATS_MAPPING,
            },
          },
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async addStore(store: any) {
    try {
      const document = createStoreDocument(store);
      const result = await this.elasticsearchService.index({
        index: 'stores',
        id: store.storeId.toString(),
        body: document,
      });
      return result;
    } catch (error) {
      console.error('Failed to index store:', error);
      throw error;
    }
  }

  async searchStore(params: {
    query?: string;
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    subCategory?: string | string[];
    classify?: string;
  }) {
    const { query = '', page = 1, limit = 10, type, category, subCategory, classify } = params;

    // Normalize parameters
    const normalizedCategory = category?.toLowerCase().trim();
    const normalizedSubCategory = Array.isArray(subCategory)
      ? subCategory.map(s => s.toLowerCase().trim())
      : subCategory?.toLowerCase().trim();
    const normalizedType = type?.toLowerCase().trim();
    // Calculate pagination parameters
    const from = (page - 1) * limit;

    // Build query
    const shouldClauses = [];
    const filterClauses = [];

    // Text search with fuzzy matching for name and subTitle
    if (query) {
      shouldClauses.push(
        {
          term: {
            'name.keyword': {
              value: query,
              boost: 15.0,
            },
          },
        },
        {
          match_phrase: {
            name: {
              query,
              boost: 5.0,
              slop: 0,
            },
          },
        },
        {
          match: {
            name: {
              query,
              fuzziness: 'AUTO',
              operator: 'AND',
              boost: 3.0,
              minimum_should_match: '70%',
            },
          },
        },
        {
          match: {
            name: {
              query,
              fuzziness: 'AUTO',
              operator: 'OR',
              boost: 2.0,
            },
          },
        },
      );

      shouldClauses.push(
        {
          term: {
            'subTitle.keyword': {
              value: query,
              boost: 8.0,
            },
          },
        },
        {
          match_phrase: {
            subTitle: {
              query,
              boost: 3.0,
              slop: 0,
            },
          },
        },
        {
          match: {
            subTitle: {
              query,
              fuzziness: 'AUTO',
              operator: 'AND',
              boost: 1.0,
              minimum_should_match: '70%',
            },
          },
        },
        {
          match: {
            subTitle: {
              query,
              fuzziness: 'AUTO',
              operator: 'OR',
            },
          },
        },
      );
    }

    // Type filter
    if (type) {
      filterClauses.push({
        term: { categoryType: normalizedType },
      });
    }

    // Category filter
    if (category) {
      filterClauses.push({
        term: { 'categorySlug.keyword': normalizedCategory },
      });
    }

    // classify filter
    if (classify === 'Duplicate') {
      filterClauses.push({
        term: { duplicateProduct: true },
      });
    } else if (classify === 'Unique') {
      filterClauses.push({
        term: { duplicateProduct: false },
      });
    }

    // SubCategory filter (supports multiple values)
    if (subCategory) {
      if (Array.isArray(subCategory)) {
        filterClauses.push({
          terms: {
            'subCategorySlug.keyword': normalizedSubCategory,
          },
        });
      } else {
        filterClauses.push({
          term: {
            'subCategorySlug.keyword': normalizedSubCategory,
          },
        });
      }
    }

    // Add status filter to always return only active stores
    filterClauses.push({
      term: { status: 'active' },
    });

    // Build the query object
    const queryObject: any = {
      bool: {},
    };

    if (shouldClauses.length > 0) {
      queryObject.bool.should = shouldClauses;
      queryObject.bool.minimum_should_match = 1;
    }

    if (filterClauses.length > 0) {
      queryObject.bool.filter = filterClauses;
    }

    // If no query conditions, match all documents
    if (Object.keys(queryObject.bool).length === 0) {
      queryObject.bool.must = { match_all: {} };
    }

    // Execute search
    const response = await this.elasticsearchService.search({
      index: 'stores',
      from,
      size: limit,
      query: queryObject,
      sort: [{ _score: { order: 'desc' } }],
    });

    // Extract and format results
    const hits = response.hits.hits;
    const total =
      typeof response.hits.total === 'number' ? response.hits.total : response.hits.total.value;

    let storeIds: string[];
    const resultIds = hits.map(hit => (hit._source as StoreDocument).storeId);

    let sponsoredIds: string[] = [];

    if (!query && category) {
      const storeWinnerIds =
        await this.elasticSearchPositionService.getPositionsByCategory(normalizedCategory);
      sponsoredIds = storeWinnerIds;
      const uniqueResultIds = resultIds.filter(id => !storeWinnerIds.includes(id));
      storeIds = [...storeWinnerIds, ...uniqueResultIds];
    } else if (!query && !category && type) {
      const storeWinnerIds =
        await this.elasticSearchPositionService.getPositionsByType(normalizedType);
      sponsoredIds = storeWinnerIds;
      const uniqueResultIds = resultIds.filter(id => !storeWinnerIds.includes(id));
      storeIds = [...storeWinnerIds, ...uniqueResultIds];
    } else {
      storeIds = resultIds;
    }

    const stores = await this.sdk.GetStore({
      where: {
        storeId: {
          _in: storeIds.map(String),
        },
      },
    });

    const sortedStores = storeIds.map(id => {
      const store = stores.listingStores.find(store => store.storeId === id);
      if (store) {
        return {
          ...store,
          isSponsor: sponsoredIds.includes(id),
        };
      }
      return store;
    });

    return {
      results: sortedStores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteStore(storeId: string | number) {
    return this.elasticsearchService.delete({
      index: 'stores',
      id: storeId.toString(),
    });
  }

  async updateStore(store: any) {
    const document = createStoreDocument(store);
    return this.elasticsearchService.update({
      index: 'stores',
      id: document.storeId.toString(),
      body: { doc: document },
    });
  }

  async saveSearchHistory(userId: string, content: string, ip: string) {
    try {
      // Check rate limit - allow 10 searches per minute per IP
      const isAllowed = await this.rateLimitService.checkRateLimit(ip, 10, 60 * 1000);
      if (!isAllowed) {
        throw new Error('Too many search requests. Please try again later.');
      }

      const normalizedContent = content.trim().replace(/\s+/g, ' ');

      const searchResponse = await this.elasticsearchService.search({
        index: 'search-history',
        body: {
          query: {
            bool: {
              must: [{ term: { userId } }, { match: { 'content.keyword': normalizedContent } }],
            },
          },
        },
      });

      const totalHits =
        typeof searchResponse.hits.total === 'number'
          ? searchResponse.hits.total
          : searchResponse.hits.total.value;

      if (totalHits > 0) {
        // Search exists, get the current document
        const existingDoc = searchResponse.hits.hits[0];
        const currentCount = (existingDoc._source as SearchHistoryDocument).searchCount || 0;

        // Update with incremented count
        await this.elasticsearchService.update({
          index: 'search-history',
          id: existingDoc._id,
          body: {
            doc: {
              searchCount: currentCount + 1,
              updatedAt: new Date(),
              refresh: true,
            },
          },
        });
      } else {
        // Create new document
        const document: SearchHistoryDocument = {
          userId,
          content: normalizedContent,
          searchCount: 1,
          updatedAt: new Date(),
        };

        await this.elasticsearchService.index({
          index: 'search-history',
          body: document,
          refresh: true,
        });
      }

      const statsResponse = await this.elasticsearchService.search({
        index: 'search-stats',
        body: {
          query: {
            match: { 'content.keyword': normalizedContent },
          },
          size: 1,
        },
      });

      const statsHits =
        typeof statsResponse.hits.total === 'number'
          ? statsResponse.hits.total
          : statsResponse.hits.total.value;

      if (statsHits > 0) {
        // Stats exists, update count
        const existingStats = statsResponse.hits.hits[0];
        const currentTotalCount =
          (existingStats._source as SearchStatsDocument).totalSearchCount || 0;

        await this.elasticsearchService.update({
          index: 'search-stats',
          id: existingStats._id,
          body: {
            doc: {
              totalSearchCount: currentTotalCount + 1,
              updatedAt: new Date(),
            },
          },
        });
      } else {
        // Create new stats document
        await this.elasticsearchService.index({
          index: 'search-stats',
          body: {
            content: normalizedContent,
            totalSearchCount: 1,
            updatedAt: new Date(),
          },
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to save search history:', error);
      throw error;
    }
  }

  async getSearchHistory(userId: string) {
    try {
      const userSearchResponse = await this.elasticsearchService.search({
        index: 'search-history',
        body: {
          query: {
            term: { userId: userId },
          },
          sort: [{ searchCount: { order: 'desc' } }, { updatedAt: { order: 'desc' } }],
          size: 10,
        },
      });
      const histories = userSearchResponse.hits.hits.map(hit => {
        const source = hit._source as { content: string; searchCount: number };
        return {
          id: hit._id,
          content: source.content,
          searchCount: source.searchCount,
          personal: true,
        };
      });

      return { histories };
    } catch (error) {
      console.error('Failed to get search history:', error);
      throw error;
    }
  }

  async deleteSearchHistory(userId: string, historyId: string) {
    try {
      // Verify the history item belongs to the user
      const verifyResponse = await this.elasticsearchService.search({
        index: 'search-history',
        body: {
          query: {
            bool: {
              must: [{ term: { userId } }, { ids: { values: [historyId] } }],
            },
          },
        },
      });

      if (verifyResponse.hits.hits.length === 0) {
        return {
          success: false,
          message: 'Search history item not found or does not belong to user',
        };
      }

      await this.elasticsearchService.delete({
        index: 'search-history',
        id: historyId,
        refresh: true,
      });

      return {
        success: true,
        message: 'Search history item deleted successfully',
      };
    } catch (error) {
      console.error('Failed to delete search history:', error);
      throw error;
    }
  }

  async getSearchSuggestions(query: string, userId?: string, limit: number = 10) {
    try {
      const normalizedQuery = query.trim().toLowerCase();
      const suggestions = new Set<string>();

      // 1. Lấy lịch sử tìm kiếm của user (tối đa 3)
      let userHistoryResponse;
      if (userId) {
        userHistoryResponse = await this.elasticsearchService.search({
          index: 'search-history',
          body: {
            query: {
              bool: {
                must: [
                  { term: { userId } },
                  {
                    bool: {
                      should: [
                        { prefix: { 'content.keyword': normalizedQuery } },
                        { match_phrase_prefix: { content: normalizedQuery } },
                      ],
                    },
                  },
                ],
              },
            },
            sort: [{ searchCount: { order: 'desc' } }, { updatedAt: { order: 'desc' } }],
            size: 3, // Limit to 3 user search histories
          },
        });

        userHistoryResponse.hits.hits.forEach(hit => {
          const source = hit._source as SearchHistoryDocument;
          suggestions.add(source.content);
        });
      }

      // 2. Tìm kiếm từ search-stats (từ khóa phổ biến)
      const statsResponse = await this.elasticsearchService.search({
        index: 'search-stats',
        body: {
          query: {
            bool: {
              should: [
                { prefix: { 'content.keyword': normalizedQuery } },
                { match_phrase_prefix: { content: normalizedQuery } },
              ],
            },
          },
          sort: [{ totalSearchCount: { order: 'desc' } }],
          size: limit - suggestions.size, // Fill remaining suggestions
        },
      });

      // Thêm từ khóa phổ biến
      statsResponse.hits.hits.forEach(hit => {
        const source = hit._source as SearchStatsDocument;
        suggestions.add(source.content);
      });

      // 3. Tìm kiếm từ stores (tên cửa hàng) nếu cần
      if (suggestions.size < limit) {
        const remainingSize = limit - suggestions.size;
        const storesResponse = await this.elasticsearchService.search({
          index: 'stores',
          body: {
            query: {
              bool: {
                should: [
                  { prefix: { name: normalizedQuery } },
                  { match_phrase_prefix: { name: normalizedQuery } },
                ],
              },
            },
            sort: [{ averageRating: { order: 'desc' } }],
            _source: ['name'],
            size: remainingSize,
          },
        });

        // Thêm tên cửa hàng
        storesResponse.hits.hits.forEach(hit => {
          const source = hit._source as { name: string };
          suggestions.add(source.name);
        });
      }

      // Phân loại kết quả
      const result = Array.from(suggestions)
        .slice(0, limit)
        .map(content => {
          const isFromHistory =
            userId &&
            userHistoryResponse?.hits.hits.some(
              hit => (hit._source as SearchHistoryDocument).content === content,
            );

          return {
            content,
            type: isFromHistory ? 'history' : 'suggestion',
          };
        });

      return { suggestions: result };
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      throw error;
    }
  }

  async getTopSearchStats(limit: number = 3) {
    try {
      const response = await this.elasticsearchService.search({
        index: 'search-stats',
        body: {
          query: {
            match_all: {},
          },
          sort: [{ totalSearchCount: { order: 'desc' } }],
          size: limit,
        },
      });

      const results = response.hits.hits.map(hit => {
        const source = hit._source as SearchStatsDocument;
        return {
          content: source.content,
          totalSearchCount: source.totalSearchCount,
          updatedAt: source.updatedAt,
        };
      });

      return { results };
    } catch (error) {
      console.error('Failed to get top search stats:', error);
      throw error;
    }
  }
}

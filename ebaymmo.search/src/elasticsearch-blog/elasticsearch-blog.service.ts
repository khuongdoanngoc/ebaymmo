import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BLOG_MAPPING } from 'src/common/constrant/constrant';
import { GqlSdk, InjectSdk } from 'src/sdk/sdk.module';
import { BlogDocument } from 'src/types/elastichsearch_document/document.type';
import { createBlogDocument } from 'src/utils/create-document';

@Injectable()
export class ElasticSearchBlogService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    @InjectSdk() private sdk: GqlSdk,
  ) {
    this.initializeIndices();
  }

  private async initializeIndices() {
    try {
      await this.elasticsearchService.ping();
      // Check and create 'blogs' index
      const blogsExists = await this.elasticsearchService.indices.exists({
        index: 'blogs',
      });

      if (!blogsExists) {
        await this.elasticsearchService.indices.create({
          index: 'blogs',
          body: {
            mappings: {
              properties: BLOG_MAPPING,
            },
          },
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async createBlog(blog: any) {
    try {
      const document = createBlogDocument(blog);
      const result = await this.elasticsearchService.index({
        index: 'blogs',
        id: blog.uuid,
        body: document,
        refresh: true,
      });
      return result;
    } catch (error) {
      console.error('Failed to index blog:', error);
      throw error;
    }
  }

  async updateBlog(blog: any) {
    try {
      const document = createBlogDocument(blog);
      const result = await this.elasticsearchService.update({
        index: 'blogs',
        id: blog.uuid,
        body: { doc: document },
        refresh: true,
      });
      return result;
    } catch (error) {
      console.error('Failed to update blog:', error);
      throw error;
    }
  }

  async deleteBlog(blogId: string) {
    try {
      const result = await this.elasticsearchService.delete({
        index: 'blogs',
        id: blogId,
        refresh: true,
      });
      return result;
    } catch (error) {
      console.error('Failed to delete blog:', error);
      throw error;
    }
  }

  async searchBlogs(query: string, tags?: string[], page = 1, limit = 6) {
    try {
      let searchQuery;

      if (!query && (!tags || (tags.length === 1 && tags[0] === ''))) {
        searchQuery = {
          match_all: {},
        };
      } else {
        const boolQuery: any = {
          bool: {
            must: [],
          },
        };

        if (query) {
          boolQuery.bool.must.push({
            bool: {
              should: [
                {
                  match_phrase_prefix: {
                    title: {
                      query: query,
                      boost: 15.0,
                      max_expansions: 50,
                    },
                  },
                },
                {
                  match_phrase: {
                    title: {
                      query: query,
                      boost: 10.0,
                      slop: 1,
                    },
                  },
                },
                {
                  match: {
                    title: {
                      query: query,
                      operator: 'AND',
                      boost: 5.0,
                      fuzziness: 1,
                      minimum_should_match: '75%',
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          });
        }

        if (tags && tags.length > 0 && tags[0] !== '') {
          boolQuery.bool.must.push({
            terms: {
              tags: tags,
            },
          });
        }

        searchQuery = boolQuery;
      }

      // Calculate pagination parameters
      const from = (page - 1) * limit;

      const result = await this.elasticsearchService.search({
        index: 'blogs',
        body: {
          query: searchQuery,
          highlight: {
            fields: {
              title: {},
            },
          },
          sort: [{ createdAt: { order: 'desc' } }],
          from: from,
          size: limit,
        },
      });

      const blogIds = result.hits.hits.map(hit => (hit._source as BlogDocument).id);

      // Get total count from Elasticsearch result
      const total =
        typeof result.hits.total === 'number' ? result.hits.total : result.hits.total.value;

      const blogs = await this.sdk.GetBlogsWithIds({
        _in: blogIds,
      });

      const sortedBlogs = blogIds.map(id => blogs.blogs.find(blog => blog.blogId === id));

      return {
        blogs: sortedBlogs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Failed to search blogs:', error);
      throw error;
    }
  }
}

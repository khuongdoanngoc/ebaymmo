import { MappingProperty } from '@elastic/elasticsearch/lib/api/types';

export const STORE_MAPPING: Record<string, MappingProperty> = {
  storeId: { type: 'keyword' },
  name: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
  subTitle: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
  status: { type: 'keyword' },
  categoryType: { type: 'keyword' },
  categorySlug: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
  subCategorySlug: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
  duplicateProduct: { type: 'boolean' },
};

export const BLOG_MAPPING: Record<string, MappingProperty> = {
  id: { type: 'keyword' },
  tags: { type: 'keyword' },
  slug: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
  title: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
};

export const POSITION_MAPPING: Record<string, MappingProperty> = {
  positionId: { type: 'keyword' },
  categorySlug: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
  type: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
  position: { type: 'integer' },
  winnerStores: { type: 'keyword' },
  status: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
  description: { type: 'text' },
};

export const SEARCH_HISTORY_MAPPING: Record<string, MappingProperty> = {
  userId: {
    type: 'keyword',
  },
  content: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
  searchCount: { type: 'integer' },
  updatedAt: { type: 'date' },
};

export const SEARCH_STATS_MAPPING: Record<string, MappingProperty> = {
  content: {
    type: 'text',
    fields: {
      keyword: { type: 'keyword' },
    },
  },
  totalSearchCount: { type: 'integer' },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
};

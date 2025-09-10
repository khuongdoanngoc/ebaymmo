import {
  BlogDocument,
  PositionDocument,
  StoreDocument,
} from 'src/types/elastichsearch_document/document.type';

export const createStoreDocument = (store: any): StoreDocument => {
  return {
    storeId: store.storeId || store.store_id,
    name: store.storeName || store.store_name,
    subTitle: store.subTitle || store.sub_title,
    averageRating: store.averageRating || store.average_rating,
    totalRatings: store.ratingTotal || store.rating_total,
    totalSoldCount: store.totalSoldCount > 0 ? store.totalSoldCount || store.total_sold_count : 0,
    totalStockCount:
      store.totalStockCount > 0 ? store.totalStockCount || store.total_stock_count : 0,
    slug: store.slug || store.slug,
    status: store.status || store.status,
    categoryType: store.category?.type || store.category?.type,
    categorySlug: store.category?.category?.slug || store.category?.slug,
    subCategorySlug: store.category?.category?.slug ? store.category?.slug : '',
    duplicateProduct:
      store.duplicateProduct !== undefined ? store.duplicateProduct : store.duplicate_product,
  };
};

export const createBlogDocument = (blog: any): BlogDocument => {
  const tags = Array.isArray(blog.tags)
    ? blog.tags.map(tag => tag.name.toLowerCase() || tag.slug || '').filter(Boolean)
    : [];

  return {
    id: blog.uuid,
    tags: tags,
    slug: blog.slug,
    title: blog.title,
    createdAt: blog.created_at,
  };
};

export const createPositionDocument = (position: any): PositionDocument => {
  const _position = Number(position.positionName.split(' ')?.[1]);
  return {
    positionId: position.positionId || position.position_id,
    categorySlug: position?.category?.slug,
    type: position?.category?.type,
    position: _position,
    winnerStores: position?.winnerStores || position.winner_stores || '',
    status: position.status,
    description: position.description,
  };
};

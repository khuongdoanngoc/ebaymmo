export interface StoreDocument {
  storeId: string;
  name: string;
  subTitle: string;
  averageRating: number;
  totalRatings: number;
  totalSoldCount: number;
  totalStockCount: number;
  slug: string;
  status: string;
  categorySlug?: string;
  categoryType?: string;
  subCategorySlug?: string;
  duplicateProduct?: boolean;
}

export interface SearchHistoryDocument {
  userId: string;
  content: string;
  searchCount: number;
  updatedAt: Date;
}

export interface SearchStatsDocument {
  content: string;
  totalSearchCount: number;
  updatedAt: Date;
}

export interface BlogDocument {
  id: string;
  tags: string[];
  slug: string;
  title: string;
  createdAt: string;
}

export interface PositionDocument {
  positionId: string;
  categorySlug: string;
  type: string;
  position: number;
  winnerStores: string;
  status: string;
  description: string;
}

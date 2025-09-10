import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchStoreDto {
  @IsString()
  @IsOptional()
  query?: string;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => {
    return typeof value === 'string' && value.includes(',') ? value.split(',') : value;
  })
  subCategory?: string | string[];

  @IsString()
  @IsOptional()
  classify?: string;
}

export class StoreSearchResultDto {
  storeId: string;
  name: string;
  subTitle: string;
  averageRating: number;
  totalRatings: number;
  avatar: string;
  storePrice: number;
  totalSoldCount: number;
  totalStockCount: number;
  storeTag: string;
  slug: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  categoryType: string;
  categorySlug: string;
  subCategorySlug: string;
}

export class PaginationDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SearchStoreResponseDto {
  results: StoreSearchResultDto[];
  subCategories: string[];
  pagination: PaginationDto;
}

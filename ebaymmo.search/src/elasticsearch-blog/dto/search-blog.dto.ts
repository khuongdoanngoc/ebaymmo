import { IsOptional, IsString, IsNumber, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchBlogDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsOptional()
  @Transform(({ value }) => {
    return typeof value === 'string' && value.includes(',')
      ? value.toLowerCase().split(',')
      : [value.toLowerCase()];
  })
  tags?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(100)
  limit?: number = 6;
}

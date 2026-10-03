import { StockMovementType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class QueryMovementDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  partId?: string;

  @IsOptional()
  @IsUUID()
  refId?: string;

  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;
}

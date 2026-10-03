import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class QuerySupplierDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}

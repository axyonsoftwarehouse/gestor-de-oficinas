import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class QueryInspectionTemplateDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}

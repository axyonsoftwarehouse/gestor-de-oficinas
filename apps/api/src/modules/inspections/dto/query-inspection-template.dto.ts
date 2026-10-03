import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryInspectionTemplateDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}

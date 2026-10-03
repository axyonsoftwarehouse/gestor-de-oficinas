import { QuotationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class QueryQuotationDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  jobCardId?: string;

  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;
}

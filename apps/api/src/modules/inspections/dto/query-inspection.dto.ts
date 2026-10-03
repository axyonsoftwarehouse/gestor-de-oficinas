import { InspectionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryInspectionDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  jobCardId?: string;

  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;
}

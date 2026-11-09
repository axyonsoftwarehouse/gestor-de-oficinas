import { IsOptional, IsUUID } from 'class-validator';

export class QueryVehicleModelDto {
  @IsOptional()
  @IsUUID()
  brandId?: string;
}

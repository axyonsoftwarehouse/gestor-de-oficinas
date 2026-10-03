import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class StartInspectionDto {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  vehicleId!: string;

  @IsOptional()
  @IsUUID()
  jobCardId?: string;

  @IsUUID()
  templateId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

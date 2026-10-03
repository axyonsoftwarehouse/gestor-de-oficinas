import { OdometerUnit, TransmissionType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsUUID()
  modelId?: string;

  @IsOptional()
  @IsUUID()
  fuelTypeId?: string;

  @IsOptional()
  @IsUUID()
  colorId?: string;

  @IsOptional()
  @IsUUID()
  typeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  plate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  vin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  chassis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  engineNo?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  year?: number;

  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  odometer?: number;

  @IsOptional()
  @IsEnum(OdometerUnit)
  odometerUnit?: OdometerUnit;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

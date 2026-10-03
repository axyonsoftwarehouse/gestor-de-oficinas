import { DiscountType, JobType, OdometerUnit } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateJobCardDto {
  @IsUUID()
  branchId!: string;

  @IsEnum(JobType)
  type!: JobType;

  @IsUUID()
  customerId!: string;

  @IsUUID()
  vehicleId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsUUID()
  advisorId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  odometerIn?: number;

  @IsOptional()
  @IsEnum(OdometerUnit)
  odometerUnit?: OdometerUnit;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  fuelLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  customerComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internalNotes?: string;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;
}

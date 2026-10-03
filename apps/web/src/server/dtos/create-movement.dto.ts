import { StockMovementType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateMovementDto {
  @IsUUID()
  locationId!: string;

  @IsUUID()
  partId!: string;

  @IsEnum(StockMovementType)
  type!: StockMovementType;

  /** Positivo; o sinal é derivado do tipo. ADJUSTMENT aceita valor com sinal. */
  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  refType?: string;

  @IsOptional()
  @IsUUID()
  refId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

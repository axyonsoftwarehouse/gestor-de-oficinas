import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateExpenseDto {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsUUID()
  jobCardId?: string;

  @IsString()
  @MaxLength(80)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  expenseDate!: string;
}

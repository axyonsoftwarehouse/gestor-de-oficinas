import { ApprovalStatus, InspectionResult } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpsertAnswerDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsEnum(InspectionResult)
  result?: InspectionResult;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;
}

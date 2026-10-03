import { JobStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class TransitionJobCardDto {
  @IsEnum(JobStatus)
  status!: JobStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

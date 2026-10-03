import { IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class IssueToJobDto {
  @IsUUID()
  jobCardId!: string;

  @IsUUID()
  locationId!: string;

  @IsUUID()
  partId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  /** Adiciona automaticamente uma linha de peça na OS (padrão: true). */
  @IsOptional()
  @IsBoolean()
  addToJob?: boolean;
}

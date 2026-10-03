import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLocationDto {
  @IsUUID()
  branchId!: string;

  @IsString()
  @MaxLength(120)
  name!: string;
}

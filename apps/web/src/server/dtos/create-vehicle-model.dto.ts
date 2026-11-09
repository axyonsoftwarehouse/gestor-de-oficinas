import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateVehicleModelDto {
  @IsUUID()
  brandId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;
}

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVehicleBrandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;
}

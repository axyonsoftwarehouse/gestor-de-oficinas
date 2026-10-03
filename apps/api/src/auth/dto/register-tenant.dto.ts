import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug deve conter apenas letras minúsculas, números e hífen' })
  slug?: string;

  @IsString()
  @IsNotEmpty()
  ownerName!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsString()
  @MinLength(8)
  ownerPassword!: string;
}

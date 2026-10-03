import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  /** Obrigatório quando o usuário pertence a mais de uma oficina. */
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

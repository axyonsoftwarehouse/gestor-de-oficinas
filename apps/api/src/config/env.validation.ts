import { plainToInstance } from 'class-transformer';
import { IsOptional, IsString, MinLength, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(16)
  JWT_SECRET!: string;

  @IsString()
  @MinLength(16)
  REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  API_PORT?: string;

  @IsOptional()
  @IsString()
  API_GLOBAL_PREFIX?: string;

  @IsOptional()
  @IsString()
  WEB_URL?: string;
}

/** Valida as variáveis de ambiente no boot (falha rápida). */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Configuração de ambiente inválida: ${messages}`);
  }
  return validated;
}

import 'reflect-metadata';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);

  const port = config.get<number>('API_PORT', 3333);
  const prefix = config.get<string>('API_GLOBAL_PREFIX', 'api');
  const webUrl = config.get<string>('WEB_URL', 'http://localhost:3000');
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  const corsOrigins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = corsOrigins.length > 0 ? corsOrigins : [webUrl];

  app.use(helmet());
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  app.setGlobalPrefix(prefix);
  // Em desenvolvimento reflete qualquer origem (localhost/127.0.0.1/portas),
  // evitando bloqueios por diferença de host. Em produção usa a whitelist.
  app.enableCors({
    origin: nodeEnv === 'production' ? allowedOrigins : true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  await app.listen(port);
  console.log(`API ouvindo em http://localhost:${port}/${prefix}`);
}

void bootstrap();

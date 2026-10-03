import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const port = config.get<number>('API_PORT', 3333);
  const prefix = config.get<string>('API_GLOBAL_PREFIX', 'api');
  const webUrl = config.get<string>('WEB_URL', 'http://localhost:3000');

  app.setGlobalPrefix(prefix);
  app.enableCors({ origin: webUrl, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  await app.listen(port);
  console.log(`API ouvindo em http://localhost:${port}/${prefix}`);
}

void bootstrap();

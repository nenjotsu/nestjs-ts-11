import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import compression from '@fastify/compress';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV !== 'production',
      connectionTimeout: 30000,
    })
  );
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3322);

  await app.register(compression, {
    encodings: ['br', 'gzip', 'deflate'], // brotli first for modern clients
    threshold: 1024, // only compress responses > 1KB
  });

  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown properties
      forbidNonWhitelisted: true, // throw on unknown properties
      transform: true,            // auto-transform payloads to DTO instances
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  await app.listen(port);
}
bootstrap();

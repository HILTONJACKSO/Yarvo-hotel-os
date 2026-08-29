import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false, // We use Winston
      trustProxy: true,
      bodyLimit: 52428800, // 50MB
    }),
    {
      bufferLogs: true,
    },
  );

  // Use Winston for logging
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const config = app.get(ConfigService);
  const port = config.get<number>('API_PORT', 3001);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const corsOrigins = config.get<string>('CORS_ORIGINS', 'http://localhost:3000');

  // ─── Security Headers via Helmet ────────────────────────────────────────────
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
  });

  // ─── Cookies ─────────────────────────────────────────────────────────────────
  const cookieSecret = config.get<string>('COOKIE_SECRET');
  if (!cookieSecret) {
    throw new Error('COOKIE_SECRET environment variable is missing.');
  }
  await app.register(require('@fastify/cookie'), {
    secret: cookieSecret, // for signed cookies
  });

  // ─── CORS ───────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Total-Count'],
  });

  // ─── API Versioning ──────────────────────────────────────────────────────────
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ─── Global Prefix ───────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Global Validation Pipe ──────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties (prevent mass assignment)
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true,           // Auto-transform to DTO types
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  // ─── Global Exception Filter ─────────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // ─── Global Response Transform ───────────────────────────────────────────────
  app.useGlobalInterceptors(new TransformInterceptor());

  // ─── Swagger / OpenAPI ───────────────────────────────────────────────────────
  const swaggerEnabled = config.get<string>('SWAGGER_ENABLED', 'false') === 'true';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Yarvo Hotel Management System API')
      .setDescription(
        'Production-grade Property Management System API for Yarvo Hotel, Liberia.',
      )
      .setVersion('1.0')
      .setContact(
        'Yarvo Hotel',
        'https://yarvo.com',
        'info@yarvo.com',
      )
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addTag('Health', 'System health and readiness checks')
      .addTag('Auth', 'Authentication and session management')
      .addTag('Properties', 'Hotel property configuration')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const swaggerPath = config.get<string>('SWAGGER_PATH', 'api/docs');
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // ─── Start Server ────────────────────────────────────────────────────────────
  await app.listen(port, '0.0.0.0');

  logger.log(
    `🏨 Yarvo HMS API running on port ${port} [${nodeEnv}]`,
    'Bootstrap',
  );
  if (swaggerEnabled) {
    logger.log(
      `📋 Swagger docs: http://localhost:${port}/api/docs`,
      'Bootstrap',
    );
  }
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});


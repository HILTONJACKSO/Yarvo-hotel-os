import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

/**
 * E2E Health Check Tests
 * 
 * These tests run against the real PostgreSQL 18 database.
 * They verify the actual health check workflow from HTTP request to DB query.
 * 
 * Requires: DATABASE_URL environment variable pointing to a real database.
 */
describe('Health Check (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI }); // URI versioning

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    
    const config = app.get(ConfigService);
    await (app as NestFastifyApplication).register(require('@fastify/cookie'), {
      secret: config.get<string>('COOKIE_SECRET', 'test-secret-xxxxxxxxxxxxxxxxxxxxxxxxxx'),
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/health', () => {
    it('returns 200 with real database status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('ok');
      expect(response.body.data.database.status).toBe('ok');
      expect(response.body.data.environment).toBeDefined();
      expect(response.body.requestId).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/health/ready', () => {
    it('returns 200 with ready:true when database is connected', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200);

      expect(response.body.data.ready).toBe(true);
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/health/live', () => {
    it('returns 200 with alive:true (no database required)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200);

      expect(response.body.data.alive).toBe(true);
      expect(response.body.data.timestamp).toBeDefined();
    });
  });
});


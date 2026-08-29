import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
  database: {
    status: 'ok' | 'down';
    message: string;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthStatus> {
    const dbHealthy = await this.checkDatabase();

    const overallStatus: HealthStatus['status'] = dbHealthy ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      version: process.env.npm_package_version ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'unknown',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      database: {
        status: dbHealthy ? 'ok' : 'down',
        message: dbHealthy
          ? 'PostgreSQL 18 connected'
          : 'Database connection failed',
      },
    };
  }

  async isReady(): Promise<boolean> {
    return this.checkDatabase();
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      const healthy = await this.prisma.isHealthy();
      return healthy;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }
}


import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
  Version,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService, HealthStatus } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /api/v1/health
   * Full health check including database connectivity.
   * Returns 200 if healthy, 503 if any critical dependency is down.
   */
  @Get()
  @Version('1')
  @ApiOperation({
    summary: 'System health check',
    description:
      'Returns system status including database connectivity. All values are real — not mocked.',
  })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  @ApiResponse({ status: 503, description: 'System is degraded or down' })
  async getHealth(): Promise<HealthStatus> {
    const health = await this.healthService.getHealth();

    if (health.status === 'down') {
      throw new ServiceUnavailableException({
        message: 'Service is unavailable',
        details: health,
      });
    }

    return health;
  }

  /**
   * GET /api/v1/health/ready
   * Kubernetes/Docker readiness probe.
   * Returns 200 if ready to serve traffic, 503 if not.
   */
  @Get('ready')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Returns 200 when the service is ready to accept requests.',
  })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readinessProbe(): Promise<{ ready: boolean; timestamp: string }> {
    const isReady = await this.healthService.isReady();

    if (!isReady) {
      throw new ServiceUnavailableException('Service not ready');
    }

    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/health/live
   * Kubernetes/Docker liveness probe.
   * Returns 200 if the process is alive (no DB check needed).
   */
  @Get('live')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Returns 200 if the process is alive.',
  })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getLivenessProbe(): { alive: boolean; timestamp: string } {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }
}


import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  const mockPrismaService = {
    isHealthy: jest.fn(),
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealth()', () => {
    it('returns ok status when database is healthy', async () => {
      mockPrismaService.isHealthy.mockResolvedValue(true);

      const result = await controller.getHealth();

      expect(result.status).toBe('ok');
      expect(result.database.status).toBe('ok');
      expect(result.environment).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it('returns degraded status when database is down', async () => {
      mockPrismaService.isHealthy.mockResolvedValue(false);

      const result = await controller.getHealth();

      expect(result.status).toBe('degraded');
      expect(result.database.status).toBe('down');
    });
  });

  describe('readinessProbe()', () => {
    it('returns ready:true when database is healthy', async () => {
      mockPrismaService.isHealthy.mockResolvedValue(true);

      const result = await controller.readinessProbe();

      expect(result.ready).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('throws ServiceUnavailableException when database is down', async () => {
      mockPrismaService.isHealthy.mockResolvedValue(false);

      await expect(controller.readinessProbe()).rejects.toThrow('Service not ready');
    });
  });

  describe('getLivenessProbe()', () => {
    it('returns alive:true without checking the database', () => {
      const result = controller.getLivenessProbe();

      expect(result.alive).toBe(true);
      expect(result.timestamp).toBeDefined();
      // Liveness should never call the DB
      expect(mockPrismaService.isHealthy).not.toHaveBeenCalled();
    });
  });
});


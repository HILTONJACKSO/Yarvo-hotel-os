import { Injectable } from '@nestjs/common';
import { PrismaService } from 'packages/database/src';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId: string;
    oldValues?: any;
    newValues?: any;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          oldValues: data.oldValues ? JSON.parse(JSON.stringify(data.oldValues)) : {},
          newValues: data.newValues ? JSON.parse(JSON.stringify(data.newValues)) : {},
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // We don't throw here to avoid failing the main transaction if logging fails
    }
  }

  async getLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200, // Limit to recent 200 for now
    });
  }
}

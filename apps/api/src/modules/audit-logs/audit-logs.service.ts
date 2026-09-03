import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

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
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200, // Limit to recent 200 for now
    });

    const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))] as string[];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return logs.map(log => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) || null : null,
    }));
  }
}

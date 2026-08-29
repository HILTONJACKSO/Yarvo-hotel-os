import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';

@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.workOrder.findMany({
      include: {
        room: true,
      },
      orderBy: [
        { priority: 'desc' }, // Enum order might need custom mapping for true sort, but we'll sort by created for now
        { createdAt: 'desc' },
      ],
    });
  }

  async create(createDto: CreateWorkOrderDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.create({
        data: {
          ...createDto,
          reportedById: userId,
        },
        include: { room: true },
      });

      // Business Logic: If URGENT and tied to a room, lock out the room.
      if (workOrder.priority === 'URGENT' && workOrder.roomId) {
        const room = await tx.room.findUnique({ where: { id: workOrder.roomId }});
        if (room) {
          await tx.room.update({
            where: { id: workOrder.roomId },
            data: { status: 'MAINTENANCE' },
          });

          await tx.roomStatusHistory.create({
            data: {
              roomId: workOrder.roomId,
              previousStatus: room.status,
              newStatus: 'MAINTENANCE',
              reason: `Automatic lockout due to URGENT work order: ${workOrder.description}`,
              changedById: userId,
            },
          });
        }
      }

      return workOrder;
    });
  }

  async updateStatus(id: string, updateDto: UpdateWorkOrderStatusDto) {
    const workOrder = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) throw new NotFoundException('Work order not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id },
        data: { status: updateDto.status },
        include: { room: true },
      });

      // If resolved, and room was MAINTENANCE, we could automatically flip it back to DIRTY or AVAILABLE.
      // For now, we will leave that to manual inspection to ensure it's actually ready.
      
      return updated;
    });
  }
}


import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { ChangeRoomStatusDto } from './dto/change-status.dto';
import { RoomStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createRoomDto: CreateRoomDto, userId?: string) {
    const existing = await this.prisma.room.findUnique({
      where: { number: createRoomDto.number },
    });

    if (existing) {
      throw new ConflictException(`Room number ${createRoomDto.number} already exists`);
    }

    const roomType = await this.prisma.roomType.findUnique({
      where: { id: createRoomDto.roomTypeId },
    });

    if (!roomType || roomType.deletedAt) {
      throw new BadRequestException(`RoomType ${createRoomDto.roomTypeId} not found or deleted`);
    }

    // Wrap in a transaction to also update the denormalized totalRooms count
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: createRoomDto,
        include: { roomType: true },
      });

      await tx.roomType.update({
        where: { id: createRoomDto.roomTypeId },
        data: { totalRooms: { increment: 1 } },
      });

      // Log initial status
      await tx.roomStatusHistory.create({
        data: {
          roomId: room.id,
          previousStatus: RoomStatus.AVAILABLE,
          newStatus: RoomStatus.AVAILABLE,
          reason: 'Initial room creation',
        },
      });

      if (userId) {
        await this.auditLogsService.logAction({
          userId,
          action: 'CREATE_ROOM',
          entity: 'Room',
          entityId: room.id,
          newValues: room,
        });
      }

      return room;
    });
  }

  async findAll(status?: RoomStatus, floor?: number, roomTypeId?: string) {
    const where: any = { isActive: true };
    if (status) where.status = status;
    if (floor) where.floor = floor;
    if (roomTypeId) where.roomTypeId = roomTypeId;

    return this.prisma.room.findMany({
      where,
      include: { roomType: true },
      orderBy: { number: 'asc' },
    });
  }

  async getRoomCalendar(startDateStr: string, endDateStr: string) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Fetch all active rooms, including roomType and relevant reservations
    return this.prisma.room.findMany({
      where: { isActive: true },
      orderBy: [
        { roomType: { name: 'asc' } },
        { number: 'asc' }
      ],
      include: {
        roomType: true,
        reservations: {
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
            checkInDate: { lte: endDate },
            checkOutDate: { gte: startDate }
          },
          include: {
            guest: true,
            folio: true
          }
        }
      }
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { roomType: true },
    });

    if (!room || !room.isActive) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto, userId?: string) {
    const oldRoom = await this.findOne(id); // Ensure it exists

    if (updateRoomDto.number) {
      const existing = await this.prisma.room.findFirst({
        where: { number: updateRoomDto.number, id: { not: id } },
      });

      if (existing) {
        throw new ConflictException(`Room number ${updateRoomDto.number} already exists`);
      }
    }

    if (updateRoomDto.roomTypeId) {
      const roomType = await this.prisma.roomType.findUnique({
        where: { id: updateRoomDto.roomTypeId },
      });

      if (!roomType || roomType.deletedAt) {
        throw new BadRequestException(`RoomType ${updateRoomDto.roomTypeId} not found or deleted`);
      }
    }

    return this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
      include: { roomType: true },
    });
  }

  async changeStatus(id: string, changeStatusDto: ChangeRoomStatusDto, userId: string) {
    const room = await this.findOne(id);

    if (room.status === changeStatusDto.status) {
      return room; // No change needed
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedRoom = await tx.room.update({
        where: { id },
        data: { status: changeStatusDto.status },
        include: { roomType: true },
      });

      await tx.roomStatusHistory.create({
        data: {
          roomId: id,
          previousStatus: room.status,
          newStatus: changeStatusDto.status,
          changedById: userId,
          reason: changeStatusDto.reason,
        },
      });

      if (userId && oldRoom) {
        await this.auditLogsService.logAction({
          userId,
          action: 'EDIT_ROOM',
          entity: 'Room',
          entityId: id,
          oldValues: oldRoom,
          newValues: updatedRoom
        });
      }

      return updatedRoom;
    });
  }

  async remove(id: string) {
    const room = await this.findOne(id);

    // Wrap in a transaction to also update the denormalized totalRooms count
    return this.prisma.$transaction(async (tx) => {
      const updatedRoom = await tx.room.update({
        where: { id },
        data: { isActive: false }, // Soft delete
      });

      await tx.roomType.update({
        where: { id: room.roomTypeId },
        data: { totalRooms: { decrement: 1 } },
      });

      return updatedRoom;
    });
  }
}


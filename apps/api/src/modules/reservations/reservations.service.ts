import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { ReservationStatus } from '@prisma/client';
import * as crypto from 'crypto';

import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(createReservationDto: CreateReservationDto, userId?: string) {
    const checkIn = new Date(createReservationDto.checkInDate);
    const checkOut = new Date(createReservationDto.checkOutDate);

    if (checkOut <= checkIn) {
      throw new BadRequestException('Check-out date must be strictly after check-in date');
    }

    let finalGuestId = createReservationDto.guestId;

    if (!finalGuestId) {
      if (!createReservationDto.guestFirstName || !createReservationDto.guestLastName) {
        throw new BadRequestException('Guest ID or Guest First/Last Name must be provided.');
      }
      
      const newGuest = await this.prisma.guest.create({
        data: {
          firstName: createReservationDto.guestFirstName,
          lastName: createReservationDto.guestLastName,
          email: createReservationDto.guestEmail,
          phone: createReservationDto.guestPhone,
        }
      });
      finalGuestId = newGuest.id;
    }

    const confirmationCode = this.generateConfirmationCode();

    const reservation = await this.prisma.reservation.create({
      data: {
        guestId: finalGuestId,
        companyId: createReservationDto.companyId,
        roomTypeId: createReservationDto.roomTypeId,
        roomId: createReservationDto.roomId,
        adultsCount: createReservationDto.adultsCount,
        childrenCount: createReservationDto.childrenCount,
        specialRequests: createReservationDto.specialRequests,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        confirmationCode,
        bookedById: userId,
      },
      include: {
        guest: true,
        roomType: true,
      },
    });

    // Emitting an asynchronous event to trigger email notification
    this.eventEmitter.emit('reservation.created', reservation);

    return reservation;
  }

  async findAll(status?: ReservationStatus, page: number = 1, limit: number = 50) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { checkInDate: 'asc' },
        include: {
          guest: true,
          roomType: true,
          room: true,
          folio: true,
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        roomType: true,
        room: true,
        folio: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return reservation;
  }

  async updateStatus(id: string, updateDto: UpdateReservationStatusDto, userId?: string) {
    const reservation = await this.findOne(id);

    // Business Logic: Block checking in a cancelled reservation.
    if (reservation.status === 'CANCELLED' && updateDto.status === 'CHECKED_IN') {
      throw new BadRequestException('Cannot check-in a cancelled reservation.');
    }

    const updateData: any = { status: updateDto.status };

    if (updateDto.roomId) {
      updateData.roomId = updateDto.roomId;
    }

    if (updateDto.status === 'CANCELLED') {
      updateData.cancelledById = userId;
      updateData.cancellationReason = updateDto.cancellationReason;
    }

    const updatedRes = await this.prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        guest: true,
        roomType: true,
        room: true,
      },
    });

    if (reservation.status !== 'CONFIRMED' && updateDto.status === 'CONFIRMED') {
      this.eventEmitter.emit('reservation.confirmed', updatedRes);
    }

    return updatedRes;
  }

  async checkIn(id: string, roomId: string, userId?: string) {
    const reservation = await this.findOne(id);
    
    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException(`Cannot check-in a reservation with status ${reservation.status}. Must be CONFIRMED.`);
    }

    const roomToAssign = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!roomToAssign) {
      throw new BadRequestException(`Room not found.`);
    }
    
    if (['DIRTY', 'MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED'].includes(roomToAssign.status)) {
      throw new BadRequestException(`Cannot check-in: Room ${roomToAssign.number} is currently ${roomToAssign.status}.`);
    }

    // Execute in a transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Update Reservation
      const updatedRes = await tx.reservation.update({
        where: { id },
        data: {
          status: 'CHECKED_IN',
          roomId: roomId,
        },
      });

      // 2. Update Room Status and Log
      if (roomToAssign) {
        await tx.room.update({
          where: { id: roomId },
          data: { status: 'OCCUPIED' },
        });

        await tx.roomStatusHistory.create({
          data: {
            roomId: roomId,
            previousStatus: roomToAssign.status,
            newStatus: 'OCCUPIED',
            reason: `Check-in for reservation ${reservation.confirmationCode}`,
            changedById: userId,
          },
        });
      }

      // 3. Initialize Folio and Room Charge
      const checkInTime = new Date(reservation.checkInDate).getTime();
      const checkOutTime = new Date(reservation.checkOutDate).getTime();
      let nights = Math.ceil((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24));
      if (nights < 1) nights = 1;

      const baseRate = Number(reservation.roomType.baseRateUsd);
      const roomChargeTotal = nights * baseRate;

      const folio = await tx.folio.create({
        data: {
          reservationId: id,
          status: 'OPEN',
          balance: roomChargeTotal,
        },
      });

      await tx.folioLineItem.create({
        data: {
          folioId: folio.id,
          type: 'CHARGE',
          category: 'ROOM',
          amount: roomChargeTotal,
          description: `Room Charge (${nights} night(s) @ $${baseRate.toFixed(2)})`,
          createdById: userId,
        }
      });

      return updatedRes;
    });
  }

  async checkOut(id: string, checkOutDto: any, userId?: string) {
    const reservation = await this.findOne(id);

    if (reservation.status !== 'CHECKED_IN') {
      throw new BadRequestException(`Cannot check-out a reservation with status ${reservation.status}. Must be CHECKED_IN.`);
    }

    if (!reservation.roomId) {
      throw new BadRequestException(`Reservation is checked-in but has no assigned room.`);
    }

    const roomId = reservation.roomId;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Reservation
      const updatedRes = await tx.reservation.update({
        where: { id },
        data: {
          status: 'CHECKED_OUT',
        },
      });

      // 2. Update Room Status to DIRTY for Housekeeping
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (room) {
        await tx.room.update({
          where: { id: roomId },
          data: { status: 'DIRTY' },
        });

        await tx.roomStatusHistory.create({
          data: {
            roomId: roomId,
            previousStatus: room.status,
            newStatus: 'DIRTY',
            reason: `Check-out for reservation ${reservation.confirmationCode}`,
            changedById: userId,
          },
        });
      }

      // 3. Handle Corporate Billing if requested
      const folio = await tx.folio.findUnique({ where: { reservationId: id } });
      if (folio && checkOutDto.billToCompany) {
        if (!reservation.companyId) {
          throw new BadRequestException('Cannot bill to company: Reservation is not linked to a company.');
        }

        if (folio.balance.toNumber() > 0) {
          const amountToTransfer = folio.balance;

          // Add PAYMENT_CORPORATE line item to zero out folio
          await tx.folioLineItem.create({
            data: {
              folioId: folio.id,
              type: 'PAYMENT',
              category: 'PAYMENT_CORPORATE',
              amount: amountToTransfer.times(-1), // Negative amount for payment
              description: `Billed to Corporate Account`,
              createdById: userId,
            },
          });

          // Transfer balance to Company
          await tx.company.update({
            where: { id: reservation.companyId },
            data: {
              balance: { increment: amountToTransfer },
            },
          });
          
          // Zero out Folio balance
          await tx.folio.update({
            where: { id: folio.id },
            data: { balance: 0 },
          });
        }
      }

      // 4. Close Folio
      const updatedFolio = await tx.folio.update({
        where: { reservationId: id },
        data: { status: 'CLOSED' },
      });

      this.eventEmitter.emit('folio.closed', {
        folioId: updatedFolio.id,
        reservationId: id,
      });

      return updatedRes;
    });
  }

  private generateConfirmationCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars, e.g., 'A1B2C3'
  }
}


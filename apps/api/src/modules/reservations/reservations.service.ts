import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
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
          whatsapp: createReservationDto.guestWhatsapp,
          address: createReservationDto.guestAddress,
          city: createReservationDto.guestCity,
          country: createReservationDto.guestCountry,
          }
      });
      finalGuestId = newGuest.id;
    }

    const confirmationCode = this.generateConfirmationCode();

    const reservation = await this.prisma.reservation.create({
      data: {
          status: "CONFIRMED",
        guestId: finalGuestId,
        companyId: createReservationDto.companyId,
          estimatedArrivalTime: createReservationDto.estimatedArrivalTime,
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
        orderBy: { createdAt: 'desc' },
        include: {
          guest: true,
          roomType: true,
          room: true,
          folio: true,
          notificationLogs: { orderBy: { createdAt: "desc" } },
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

  async update(id: string, updateDto: UpdateReservationDto, userId?: string) {
    const reservation = await this.findOne(id);
    const {
      guestId, guestFirstName, guestLastName, guestEmail, guestPhone, guestWhatsapp, guestAddress, guestCity, guestCountry,
      ...reservationUpdateData
    } : any = updateDto;

    // Convert dates if present
    if (reservationUpdateData.checkInDate) reservationUpdateData.checkInDate = new Date(reservationUpdateData.checkInDate);
    if (reservationUpdateData.checkOutDate) reservationUpdateData.checkOutDate = new Date(reservationUpdateData.checkOutDate);

    // If cancelled, record reason
    if (reservationUpdateData.status === 'CANCELLED') {
      reservationUpdateData.cancelledById = userId;
    }

    // Update guest if necessary (simple approach: update existing guest if details provided)
    if (reservation.guestId && (guestFirstName || guestLastName || guestEmail || guestPhone)) {
      const guestUpdate: any = {};
      if (guestFirstName) guestUpdate.firstName = guestFirstName;
      if (guestLastName) guestUpdate.lastName = guestLastName;
      if (guestEmail) guestUpdate.email = guestEmail;
      if (guestPhone) guestUpdate.phone = guestPhone;
      if (guestWhatsapp) guestUpdate.whatsapp = guestWhatsapp;
      if (guestAddress) guestUpdate.address = guestAddress;
      if (guestCity) guestUpdate.city = guestCity;
      if (guestCountry) guestUpdate.country = guestCountry;
      
      await this.prisma.guest.update({
        where: { id: reservation.guestId },
        data: guestUpdate,
      });
    }


    // Calculate if we need to adjust the Folio due to Check-Out Date change
    if (reservation.status === 'CHECKED_IN' && reservationUpdateData.checkOutDate) {
      const newCheckOut = new Date(reservationUpdateData.checkOutDate);
      const oldCheckOut = new Date(reservation.checkOutDate);
      
      // Compare just the dates (ignore time)
      newCheckOut.setHours(0,0,0,0);
      oldCheckOut.setHours(0,0,0,0);

      if (newCheckOut.getTime() !== oldCheckOut.getTime()) {
        const folio = await this.prisma.folio.findUnique({ where: { reservationId: id } });
        if (folio) {
          const checkIn = new Date(reservation.checkInDate);
          checkIn.setHours(0,0,0,0);
          
          let oldNights = Math.ceil((oldCheckOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          if (oldNights < 1) oldNights = 1;
          
          let newNights = Math.ceil((newCheckOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          if (newNights < 1) newNights = 1;

          const diffNights = newNights - oldNights;

          if (diffNights !== 0) {
            const roomType = await this.prisma.roomType.findUnique({ where: { id: reservation.roomTypeId } });
            if (roomType) {
              const baseRate = Number(roomType.baseRateUsd);
              const amountAdjustment = diffNights * baseRate;

              await this.prisma.folioLineItem.create({
                data: {
                  folioId: folio.id,
                  type: amountAdjustment > 0 ? 'CHARGE' : 'ADJUSTMENT',
                  category: 'ROOM',
                  amount: amountAdjustment > 0 ? amountAdjustment : -amountAdjustment,
                  description: `Early/Late Check-Out Adjustment (${diffNights > 0 ? '+' : ''}${diffNights} night(s))`,
                  createdById: userId,
                }
              });

              await this.prisma.folio.update({
                where: { id: folio.id },
                data: { balance: { increment: amountAdjustment } }
              });
            }
          }
        }
      }
    }

    const updatedRes = await this.prisma.reservation.update({
      where: { id },
      data: reservationUpdateData,
      include: {
        guest: true,
        roomType: true,
        room: true,
        folio: true,
      }
    });

    if (reservation.status !== 'CHECKED_IN' && reservationUpdateData.status === 'CHECKED_IN') {
      await this.ensureFolioAndRoomOnCheckIn(updatedRes, userId);
    } else if (reservationUpdateData.status === 'CHECKED_OUT') {
      await this.ensureFolioAndRoomOnCheckOut(updatedRes, { closeFolio: true }, userId);
    }

    return this.findOne(id);
  }

  private async ensureFolioAndRoomOnCheckOut(reservation: any, checkOutDto: any = {}, userId?: string) {
    const roomId = reservation.roomId;
    if (roomId) {
      const room = await this.prisma.room.findUnique({ where: { id: roomId } });
      if (room && room.status !== 'DIRTY') {
        await this.prisma.room.update({
          where: { id: roomId },
          data: { status: 'DIRTY' },
        }).catch(() => {});
        await this.prisma.roomStatusHistory.create({
          data: {
            roomId,
            previousStatus: room.status,
            newStatus: 'DIRTY',
            reason: `Check-out for reservation ${reservation.confirmationCode}`,
            changedById: userId,
          },
        }).catch(() => {});
      }
    }

    const folio = await this.prisma.folio.findUnique({ where: { reservationId: reservation.id } });
    if (folio) {
      const remainingBalance = Number(folio.balance || 0);
      if (remainingBalance > 0) {
        if (folio.status !== 'OPEN') {
          await this.prisma.folio.update({
            where: { id: folio.id },
            data: { status: 'OPEN' },
          }).catch(() => {});
        }
      } else if (checkOutDto?.closeFolio !== false && folio.status !== 'CLOSED') {
        const updatedFolio = await this.prisma.folio.update({
          where: { id: folio.id },
          data: { status: 'CLOSED' },
        }).catch(() => null);
        if (updatedFolio) {
          this.eventEmitter.emit('folio.closed', {
            folioId: updatedFolio.id,
            reservationId: reservation.id,
          });
        }
      }
    }
  }

  private async ensureFolioAndRoomOnCheckIn(reservation: any, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      if (reservation.roomId) {
        const room = await tx.room.findUnique({ where: { id: reservation.roomId } });
        if (room && room.status !== 'OCCUPIED') {
          await tx.room.update({
            where: { id: reservation.roomId },
            data: { status: 'OCCUPIED' },
          });
          await tx.roomStatusHistory.create({
            data: {
              roomId: reservation.roomId,
              previousStatus: room.status,
              newStatus: 'OCCUPIED',
              reason: `Check-in for reservation ${reservation.confirmationCode}`,
              changedById: userId,
            },
          });
        }
      }

      const existingFolio = await tx.folio.findUnique({ where: { reservationId: reservation.id } });
      if (existingFolio) {
        if (existingFolio.status !== 'OPEN') {
          await tx.folio.update({
            where: { id: existingFolio.id },
            data: { status: 'OPEN' },
          });
        }
        return existingFolio;
      }

      const checkInTime = new Date(reservation.checkInDate).getTime();
      const checkOutTime = new Date(reservation.checkOutDate).getTime();
      let nights = Math.ceil((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24));
      if (nights < 1) nights = 1;

      let roomsCount = 1;
      const matchRooms = (reservation.specialRequests || '').match(/\[Requested Accommodations:\s*(\d+)/i);
      if (matchRooms && matchRooms[1]) {
        roomsCount = Math.max(1, parseInt(matchRooms[1], 10) || 1);
      }

      const roomType = reservation.roomType || await tx.roomType.findUnique({ where: { id: reservation.roomTypeId } });
      const baseRate = Number(roomType?.baseRateUsd || 0);
      const roomChargeTotal = nights * baseRate * roomsCount;

      const activities = await tx.bookingActivity.findMany({
        where: { reservationId: reservation.id },
        include: { activity: true }
      });

      let activitiesTotal = 0;
      for (const act of activities) {
        activitiesTotal += Number(act.totalPrice);
      }

      const folio = await tx.folio.create({
        data: {
          reservationId: reservation.id,
          status: 'OPEN',
          balance: roomChargeTotal + activitiesTotal,
        },
      });

      await tx.folioLineItem.create({
        data: {
          folioId: folio.id,
          type: 'CHARGE',
          category: 'ROOM',
          amount: roomChargeTotal,
          description: roomsCount > 1
            ? `Room Charge (${roomsCount} accommodations × ${nights} night(s) @ $${baseRate.toFixed(2)})`
            : `Room Charge (${nights} night(s) @ $${baseRate.toFixed(2)})`,
          referenceCode: reservation.confirmationCode,
          createdById: userId,
        }
      });

      for (const act of activities) {
        const catMap = { 'TOUR': 'TOUR', 'EVENT': 'EVENT', 'PACKAGE': 'PACKAGE', 'ACTIVITY': 'ACTIVITY' };
        await tx.folioLineItem.create({
          data: {
            folioId: folio.id,
            type: 'CHARGE',
            category: (catMap as any)[act.activity.type] || 'OTHER',
            amount: Number(act.totalPrice),
            description: `${act.activity.type.charAt(0).toUpperCase() + act.activity.type.slice(1).toLowerCase()}: ${act.activity.name} (Qty: ${act.quantity})`,
            referenceCode: reservation.confirmationCode,
            createdById: userId,
          }
        });
      }

      return folio;
    });
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
        folio: true,
      },
    });

    if (reservation.status !== 'CHECKED_IN' && updateDto.status === 'CHECKED_IN') {
      await this.ensureFolioAndRoomOnCheckIn(updatedRes, userId);
    } else if (updateDto.status === 'CHECKED_OUT') {
      await this.ensureFolioAndRoomOnCheckOut(updatedRes, { closeFolio: true }, userId);
    }

    if (reservation.status !== 'CONFIRMED' && updateDto.status === 'CONFIRMED') {
      this.eventEmitter.emit('reservation.confirmed', updatedRes);
    }

    return this.findOne(id);
  }

  async checkIn(id: string, roomId: string, userId?: string) {
    const reservation = await this.findOne(id);
    
    if (reservation.status === 'CANCELLED' || reservation.status === 'CHECKED_OUT') {
      throw new BadRequestException(`Cannot check-in a reservation with status ${reservation.status}.`);
    }

    const targetRoomId = roomId || reservation.roomId;
    if (!targetRoomId) {
      throw new BadRequestException(`Please select a room to assign for check-in.`);
    }

    const roomToAssign = await this.prisma.room.findUnique({ where: { id: targetRoomId } });
    if (!roomToAssign) {
      throw new BadRequestException(`Room not found.`);
    }
    
    if (['MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED'].includes(roomToAssign.status)) {
      throw new BadRequestException(`Cannot check-in: Room ${roomToAssign.number} is currently ${roomToAssign.status}.`);
    }

    // Execute in a transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Update Reservation
      await tx.reservation.update({
        where: { id },
        data: {
          status: 'CHECKED_IN',
          roomId: targetRoomId,
        },
      });

      // 2. Update Room Status and Log
      if (roomToAssign) {
        await tx.room.update({
          where: { id: targetRoomId },
          data: { status: 'OCCUPIED' },
        });

        await tx.roomStatusHistory.create({
          data: {
            roomId: targetRoomId,
            previousStatus: roomToAssign.status,
            newStatus: 'OCCUPIED',
            reason: `Check-in for reservation ${reservation.confirmationCode}`,
            changedById: userId,
          },
        });
      }
    });

    const refreshedRes = await this.findOne(id);
    await this.ensureFolioAndRoomOnCheckIn(refreshedRes, userId);
    return this.findOne(id);
  }

  async checkOut(id: string, checkOutDto: any = {}, userId?: string) {
    const reservation = await this.findOne(id);

    if (reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW') {
      throw new BadRequestException(`Cannot check-out a reservation with status ${reservation.status}.`);
    }

    const roomId = reservation.roomId;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Reservation to CHECKED_OUT
      const updatedRes = await tx.reservation.update({
        where: { id },
        data: {
          status: 'CHECKED_OUT',
        },
        include: {
          guest: true,
          roomType: true,
          room: true,
          folio: true,
        },
      });

      // 2. Update Room Status to DIRTY (Vacant Dirty) for Housekeeping
      if (roomId) {
        const room = await tx.room.findUnique({ where: { id: roomId } });
        if (room && room.status !== 'DIRTY') {
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
      }

      // 3. Handle Corporate Billing if requested
      let folio = await tx.folio.findUnique({ where: { reservationId: id } });
      if (folio && checkOutDto?.billToCompany) {
        if (!reservation.companyId) {
          throw new BadRequestException('Cannot bill to company: Reservation is not linked to a company.');
        }

        if (folio.balance.toNumber() > 0) {
          const amountToTransfer = folio.balance;

          await tx.folioLineItem.create({
            data: {
              folioId: folio.id,
              type: 'PAYMENT',
              category: 'PAYMENT_CORPORATE',
              amount: amountToTransfer.times(-1),
              description: `Billed to Corporate Account`,
              createdById: userId,
            },
          });

          await tx.company.update({
            where: { id: reservation.companyId },
            data: {
              balance: { increment: amountToTransfer },
            },
          });
          
          folio = await tx.folio.update({
            where: { id: folio.id },
            data: { balance: 0 },
          });
        }
      }

      // 4. Keep Folio OPEN on Billing if client has pending balance (or close if settled)
      if (folio) {
        const remainingBalance = Number(folio.balance || 0);
        if (remainingBalance > 0) {
          // Ensure pending bill stays OPEN in Billing under client's booking reference
          await tx.folio.update({
            where: { id: folio.id },
            data: { status: 'OPEN' },
          });
        } else if (checkOutDto?.closeFolio !== false) {
          const updatedFolio = await tx.folio.update({
            where: { id: folio.id },
            data: { status: 'CLOSED' },
          });
          this.eventEmitter.emit('folio.closed', {
            folioId: updatedFolio.id,
            reservationId: id,
          });
        }
      }

      return updatedRes;
    });
  }

  private generateConfirmationCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars, e.g., 'A1B2C3'
  }
}


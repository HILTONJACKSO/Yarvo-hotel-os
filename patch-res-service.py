import sys
import re

with open('apps/api/src/modules/reservations/reservations.service.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Default to CONFIRMED
old_create = """      const reservation = await this.prisma.reservation.create({
        data: {
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
        },"""

new_create = """      const reservation = await this.prisma.reservation.create({
        data: {
          status: 'CONFIRMED',
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
        },"""

code = code.replace(old_create, new_create)

with open('apps/api/src/modules/reservations/reservations.service.ts', 'w', encoding='utf-8') as f:
    f.write(code)

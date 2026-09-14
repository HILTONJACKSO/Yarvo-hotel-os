import sys

with open("apps/api/src/modules/reservations/reservations.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

# We want to add Folio recalculation in the update() method
old_update = """    const updatedRes = await this.prisma.reservation.update({
      where: { id },
      data: reservationUpdateData,
      include: {
        guest: true,
        roomType: true,
      }
    });

    return updatedRes;
  }"""

new_update = """
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
      }
    });

    return updatedRes;
  }"""

code = code.replace(old_update, new_update)

with open("apps/api/src/modules/reservations/reservations.service.ts", "w", encoding="utf-8") as f:
    f.write(code)

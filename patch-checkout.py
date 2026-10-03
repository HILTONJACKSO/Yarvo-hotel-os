path = "apps/api/src/modules/reservations/reservations.service.ts"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

search_str = """      return this.prisma.$transaction(async (tx) => {
        // 1. Update Reservation
        const updatedRes = await tx.reservation.update({
          where: { id },
          data: {
            status: 'CHECKED_OUT',
          },
        });"""
# Try doing it by regex
import re

pattern = r"return this\.prisma\.\$transaction\(async \(tx\) => \{\s*// 1\. Update Reservation\s*const updatedRes = await tx\.reservation\.update\(\{\s*where: \{ id \},\s*data: \{\s*status: 'CHECKED_OUT',\s*\},\s*\}\);"

replace_str = """return this.prisma.$transaction(async (tx) => {
        const today = new Date();
        const oldCheckOut = new Date(reservation.checkOutDate);
        
        let newCheckOutDate = oldCheckOut;
        let amountAdjustment = 0;
        let diffNights = 0;

        // If checking out early, adjust the checkout date to today and calculate refund
        today.setHours(0,0,0,0);
        oldCheckOut.setHours(0,0,0,0);
        
        if (today.getTime() < oldCheckOut.getTime()) {
          newCheckOutDate = new Date();
          const checkIn = new Date(reservation.checkInDate);
          checkIn.setHours(0,0,0,0);
          
          let oldNights = Math.ceil((oldCheckOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          if (oldNights < 1) oldNights = 1;
          
          let newNights = Math.ceil((today.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          if (newNights < 1) newNights = 1;
          
          diffNights = newNights - oldNights; // this will be negative
          
          const roomType = await tx.roomType.findUnique({ where: { id: reservation.roomTypeId } });
          if (roomType) {
            const baseRate = Number(roomType.baseRateUsd);
            amountAdjustment = diffNights * baseRate; // this will be negative
          }
        }

        // 1. Update Reservation
        const updatedRes = await tx.reservation.update({
          where: { id },
          data: {
            status: 'CHECKED_OUT',
            checkOutDate: newCheckOutDate,
          },
        });

        // 1.5 Adjust Folio if checking out early
        if (amountAdjustment !== 0) {
          const folio = await tx.folio.findUnique({ where: { reservationId: id } });
          if (folio) {
            await tx.folioLineItem.create({
              data: {
                folioId: folio.id,
                type: 'ADJUSTMENT',
                category: 'ROOM',
                amount: Math.abs(amountAdjustment), // Store positive amount for ADJUSTMENT
                description: `Early Check-Out Refund (${Math.abs(diffNights)} night(s))`,
                createdById: userId,
              }
            });
            await tx.folio.update({
              where: { id: folio.id },
              data: { balance: { increment: amountAdjustment } } // amountAdjustment is negative
            });
          }
        }"""

if re.search(pattern, c):
    c = re.sub(pattern, replace_str, c)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched checkOut successfully!")
else:
    print("Could not find regex pattern")

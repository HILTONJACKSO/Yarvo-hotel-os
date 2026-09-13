import sys

with open("apps/api/src/modules/reservations/reservations.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

# Replace the update method I just added with a better one
old_method = """  async update(id: string, updateDto: UpdateReservationDto, userId?: string) {
    const reservation = await this.findOne(id);
    const updateData: any = { ...updateDto };

    // Convert dates if present
    if (updateDto.checkInDate) updateData.checkInDate = new Date(updateDto.checkInDate);
    if (updateDto.checkOutDate) updateData.checkOutDate = new Date(updateDto.checkOutDate);

    // If cancelled, record reason
    if (updateDto.status === 'CANCELLED') {
      updateData.cancelledById = userId;
    }

    const updatedRes = await this.prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        guest: true,
        roomType: true,
      }
    });

    return updatedRes;
  }"""

new_method = """  async update(id: string, updateDto: UpdateReservationDto, userId?: string) {
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

code = code.replace(old_method, new_method)

with open("apps/api/src/modules/reservations/reservations.service.ts", "w", encoding="utf-8") as f:
    f.write(code)

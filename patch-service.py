import sys
import re

with open("apps/api/src/modules/reservations/reservations.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

if "async update(id: string, updateDto: any" not in code:
    code = code.replace(
        "import { CreateReservationDto } from './dto/create-reservation.dto';",
        "import { CreateReservationDto } from './dto/create-reservation.dto';\nimport { UpdateReservationDto } from './dto/update-reservation.dto';"
    )

    new_method = """  async update(id: string, updateDto: UpdateReservationDto, userId?: string) {
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
  }

  async updateStatus"""

    code = code.replace("  async updateStatus", new_method)

    with open("apps/api/src/modules/reservations/reservations.service.ts", "w", encoding="utf-8") as f:
        f.write(code)

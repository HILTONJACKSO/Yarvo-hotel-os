import sys

with open("apps/api/src/modules/reservations/reservations.controller.ts", "r", encoding="utf-8") as f:
    code = f.read()

if "UpdateReservationDto" not in code:
    code = code.replace(
        "import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';",
        "import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';\nimport { UpdateReservationDto } from './dto/update-reservation.dto';"
    )
    
    new_patch = """
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Update a reservation (dates, guests, etc.)' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReservationDto,
    @Req() req: any,
  ) {
    return this.reservationsService.update(id, updateDto, req.user?.id);
  }

  @Patch(':id/status')"""
    
    code = code.replace("  @Patch(':id/status')", new_patch)

    with open("apps/api/src/modules/reservations/reservations.controller.ts", "w", encoding="utf-8") as f:
        f.write(code)

import re

file_path = "apps/api/src/modules/tickets/tickets.controller.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_routes = """
  @Get('tiers')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'CASHIER', 'TICKETING_STAFF')
  async getTiers() {
    const data = await this.ticketsService.getTiers();
    return { data };
  }

  @Post('tiers')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  async createTier(@Body() data: { name: string; price: number }) {
    const tier = await this.ticketsService.createTier(data);
    return { message: 'Ticket tier created', data: tier };
  }

  @Delete('tiers/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO')
  async deleteTier(@Param('id') id: string) {
    const data = await this.ticketsService.deleteTier(id);
    return { message: 'Ticket tier deleted', data };
  }
"""

content = content.replace("  @Get('stats/daily')", new_routes + "\n  @Get('stats/daily')")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added tiers endpoints to tickets.controller.ts")

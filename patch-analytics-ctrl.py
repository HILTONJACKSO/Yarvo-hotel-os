import sys

with open("apps/api/src/modules/analytics/analytics.controller.ts", "r", encoding="utf-8") as f:
    code = f.read()

new_endpoint = """
  @Get('discounts')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get discounts from folios and POS' })
  async getDiscounts(@Query('start') start?: string, @Query('end') end?: string) {
    const data = await this.analyticsService.getDiscounts(start, end);
    return { data };
  }
"""

code = code.rsplit('}', 1)
new_code = code[0] + new_endpoint + '}'
with open("apps/api/src/modules/analytics/analytics.controller.ts", "w", encoding="utf-8") as f:
    f.write(new_code)

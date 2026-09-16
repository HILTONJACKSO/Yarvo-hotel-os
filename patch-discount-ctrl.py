import sys

with open("apps/api/src/modules/folios/folios.controller.ts", "r", encoding="utf-8") as f:
    code = f.read()

new_endpoint = """
  @Post(':id/discount')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'Post a discount to a folio' })
  postDiscount(
    @Param('id') id: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: any,
  ) {
    return this.foliosService.postDiscount(id, createPaymentDto, req.user?.id);
  }
"""

code = code.rsplit('}', 1)
new_code = code[0] + new_endpoint + '}'
with open("apps/api/src/modules/folios/folios.controller.ts", "w", encoding="utf-8") as f:
    f.write(new_code)

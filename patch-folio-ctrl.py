import sys

with open("apps/api/src/modules/folios/folios.controller.ts", "r", encoding="utf-8") as f:
    code = f.read()

new_endpoint = """
  @Post(':id/close')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'Close a folio manually' })
  closeFolio(@Param('id') id: string, @Req() req: any) {
    return this.foliosService.closeFolio(id, req.user?.id);
  }
"""

code = code.rsplit('}', 1)
new_code = code[0] + new_endpoint + '}'
with open("apps/api/src/modules/folios/folios.controller.ts", "w", encoding="utf-8") as f:
    f.write(new_code)

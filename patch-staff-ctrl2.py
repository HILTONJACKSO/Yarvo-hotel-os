import sys

with open("apps/api/src/modules/staff/staff.controller.ts", "r", encoding="utf-8") as f:
    code = f.read()

# Fix role check
old_attend = """  @Get('attendance')
  getAttendance(@Query('date') date?: string, @Req() req?: any) {
    const isManager = ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER'].includes(req?.user?.role);"""

new_attend = """  @Get('attendance')
  getAttendance(@Query('date') date?: string, @Req() req?: any) {
    const isManager = req?.user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER'].includes(r));"""

code = code.replace(old_attend, new_attend)

old_payroll = """  @Get('payroll')
  getPayslips(@Query('periodStart') start?: string, @Query('periodEnd') end?: string, @Req() req?: any) {
    const isManager = ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER'].includes(req?.user?.role);"""

new_payroll = """  @Get('payroll')
  getPayslips(@Query('periodStart') start?: string, @Query('periodEnd') end?: string, @Req() req?: any) {
    const isManager = req?.user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER'].includes(r));"""

code = code.replace(old_payroll, new_payroll)

with open("apps/api/src/modules/staff/staff.controller.ts", "w", encoding="utf-8") as f:
    f.write(code)

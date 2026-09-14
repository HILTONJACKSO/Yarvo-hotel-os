import sys

with open("apps/api/src/modules/staff/staff.controller.ts", "r", encoding="utf-8") as f:
    code = f.read()

# Make sure Req is imported
if "Req" not in code.split("}")[0]:
    code = code.replace("Query } from '@nestjs/common';", "Query, Req } from '@nestjs/common';")

# Modify attendance
old_attend = """  @Get('attendance')
  getAttendance(@Query('date') date?: string) {
    return this.staffService.getAttendances(date);
  }"""
new_attend = """  @Get('attendance')
  getAttendance(@Query('date') date?: string, @Req() req?: any) {
    const isManager = ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER'].includes(req?.user?.role);
    const filterUserId = isManager ? undefined : req?.user?.id;
    return this.staffService.getAttendances(date, filterUserId);
  }"""
code = code.replace(old_attend, new_attend)

# Modify payroll
old_payroll = """  @Get('payroll')
  getPayslips(@Query('periodStart') start?: string, @Query('periodEnd') end?: string) {
    return this.staffService.getPayslips(start, end);
  }"""
new_payroll = """  @Get('payroll')
  getPayslips(@Query('periodStart') start?: string, @Query('periodEnd') end?: string, @Req() req?: any) {
    const isManager = ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER'].includes(req?.user?.role);
    const filterUserId = isManager ? undefined : req?.user?.id;
    return this.staffService.getPayslips(start, end, filterUserId);
  }"""
code = code.replace(old_payroll, new_payroll)

with open("apps/api/src/modules/staff/staff.controller.ts", "w", encoding="utf-8") as f:
    f.write(code)

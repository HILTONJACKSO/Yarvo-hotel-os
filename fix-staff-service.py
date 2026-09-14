import sys

with open("apps/api/src/modules/staff/staff.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

old_func = """  async getPayslips(periodStart?: string, periodEnd?: string) {
    const where: any = {};
    if (periodStart && periodEnd) {
      where.periodStart = { gte: new Date(periodStart) };
      where.periodEnd = { lte: new Date(periodEnd) };
    }
    return this.prisma.payslip.findMany({"""

new_func = """  async getPayslips(periodStart?: string, periodEnd?: string, userId?: string) {
    const where: any = {};
    if (periodStart && periodEnd) {
      where.periodStart = { gte: new Date(periodStart) };
      where.periodEnd = { lte: new Date(periodEnd) };
    }
    if (userId) {
      where.userId = userId;
    }
    return this.prisma.payslip.findMany({"""

code = code.replace(old_func, new_func)

with open("apps/api/src/modules/staff/staff.service.ts", "w", encoding="utf-8") as f:
    f.write(code)

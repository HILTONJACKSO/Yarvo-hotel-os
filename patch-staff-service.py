import sys

with open("apps/api/src/modules/staff/staff.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

# Modify getAttendances
old_getAttend = """  async getAttendances(date?: string) {
    return this.prisma.attendance.findMany({
      where: date ? { date: new Date(date) } : undefined,"""

new_getAttend = """  async getAttendances(date?: string, userId?: string) {
    const where: any = {};
    if (date) where.date = new Date(date);
    if (userId) where.userId = userId;

    return this.prisma.attendance.findMany({
      where,"""
code = code.replace(old_getAttend, new_getAttend)

# Modify getPayslips
old_getPayslips = """  async getPayslips(start?: string, end?: string) {
    const where: any = {};
    if (start && end) {
      where.periodStart = { gte: new Date(start) };
      where.periodEnd = { lte: new Date(end) };
    }"""
new_getPayslips = """  async getPayslips(start?: string, end?: string, userId?: string) {
    const where: any = {};
    if (start && end) {
      where.periodStart = { gte: new Date(start) };
      where.periodEnd = { lte: new Date(end) };
    }
    if (userId) {
      where.userId = userId;
    }"""
code = code.replace(old_getPayslips, new_getPayslips)

with open("apps/api/src/modules/staff/staff.service.ts", "w", encoding="utf-8") as f:
    f.write(code)

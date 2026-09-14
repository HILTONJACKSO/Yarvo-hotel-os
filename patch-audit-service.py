import sys

with open("apps/api/src/modules/audit-logs/audit-logs.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

old_get = """  async getLogs() {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200, // Limit to recent 200 for now
    });"""

new_get = """  async getLogs(start?: string, end?: string) {
    const where: any = {};
    if (start && end) {
      where.createdAt = {
        gte: new Date(start),
        lte: new Date(new Date(end).setUTCHours(23, 59, 59, 999))
      };
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: (start && end) ? undefined : 200, // No limit if date range specified, otherwise 200
    });"""

code = code.replace(old_get, new_get)

with open("apps/api/src/modules/audit-logs/audit-logs.service.ts", "w", encoding="utf-8") as f:
    f.write(code)

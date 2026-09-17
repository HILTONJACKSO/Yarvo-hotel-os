import sys

with open("apps/api/src/modules/analytics/analytics.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("await this.prisma.order.findMany", "await this.prisma.posOrder.findMany")

with open("apps/api/src/modules/analytics/analytics.service.ts", "w", encoding="utf-8") as f:
    f.write(code)

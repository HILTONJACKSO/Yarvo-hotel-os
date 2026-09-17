import sys

with open("packages/database/prisma/schema.prisma", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("totalPayments    Decimal?         @db.Decimal(12, 2)", "totalPayments    Decimal?         @db.Decimal(12, 2)\n    totalTicketRevenue Decimal?       @db.Decimal(12, 2)\n    totalDiscounts   Decimal?         @db.Decimal(12, 2)")

with open("packages/database/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(code)

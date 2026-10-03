path = "apps/api/src/modules/analytics/analytics.service.ts"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

s1 = """          where: {
            OR: [
              { status: 'PAID', updatedAt: { gte: startDate } },
              { status: 'BILLED_TO_ROOM', folio: { status: 'CLOSED', updatedAt: { gte: startDate } } }
            ]
          }"""
r1 = """          where: { status: { in: ['PAID', 'BILLED_TO_ROOM'] }, updatedAt: { gte: startDate } }"""

s2 = """        where: {
          OR: [
            { status: 'PAID', updatedAt: { gte: startOfPeriod, lte: endOfPeriod } },
            { status: 'BILLED_TO_ROOM', folio: { status: 'CLOSED', updatedAt: { gte: startOfPeriod, lte: endOfPeriod } } }
          ]
        },"""
r2 = """        where: { status: { in: ['PAID', 'BILLED_TO_ROOM'] }, updatedAt: { gte: startOfPeriod, lte: endOfPeriod } },"""

c = c.replace(s1, r1)
c = c.replace(s2, r2)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("Replaced!")

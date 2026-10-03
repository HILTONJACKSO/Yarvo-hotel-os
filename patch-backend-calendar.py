import re

path = "apps/api/src/modules/rooms/rooms.service.ts"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("status: { in: ['CONFIRMED', 'CHECKED_IN'] }", "status: { notIn: ['CANCELLED', 'NO_SHOW'] }")

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("Patched backend")

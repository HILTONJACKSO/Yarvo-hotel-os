import sys
import re

with open('apps/api/src/modules/reservations/reservations.service.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "orderBy: { checkInDate: 'asc' },",
    "orderBy: { createdAt: 'desc' },"
)

with open('apps/api/src/modules/reservations/reservations.service.ts', 'w', encoding='utf-8') as f:
    f.write(code)

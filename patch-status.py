import sys
import re

with open('apps/api/src/modules/reservations/reservations.service.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(
    r'(const reservation = await this\.prisma\.reservation\.create\(\{\s*data:\s*\{)',
    r'\1\n          status: "CONFIRMED",',
    code
)

with open('apps/api/src/modules/reservations/reservations.service.ts', 'w', encoding='utf-8') as f:
    f.write(code)

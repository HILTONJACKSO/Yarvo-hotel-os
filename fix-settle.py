import sys
import re

with open('apps/api/src/modules/pos/pos.service.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(
    r"if \(\s*order\.status !== 'SERVED'\s*\) \{(?:.*?)(?:\}\s*)$",
    r"if (order.status !== 'SERVED' && order.status !== 'OPEN') { throw new ForbiddenException('Order cannot be settled in its current state.'); }",
    code,
    flags=re.MULTILINE | re.DOTALL
)

with open('apps/api/src/modules/pos/pos.service.ts', 'w', encoding='utf-8') as f:
    f.write(code)

import sys

with open('apps/api/src/modules/pos/pos.service.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix settleOrder back to strict SERVED requirement
old_check = "if (order.status !== 'SERVED' && order.status !== 'OPEN') {"
new_check = "if (order.status !== 'SERVED') {"

code = code.replace(old_check, new_check)

with open('apps/api/src/modules/pos/pos.service.ts', 'w', encoding='utf-8') as f:
    f.write(code)

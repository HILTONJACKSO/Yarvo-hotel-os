import sys

with open('apps/api/src/modules/pos/pos.service.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix getServedOrders to include OPEN
code = code.replace(
    "where: { status: 'SERVED' },",
    "where: { status: { in: ['OPEN', 'SERVED'] } },"
)

# Fix getActiveOrders to still show PAID orders if they have PENDING items
code = code.replace(
    "{ items: { some: { status: 'RETURN_REQUESTED' } } }",
    "{ items: { some: { status: { in: ['PENDING', 'RETURN_REQUESTED'] } } } }"
)

# Fix settleOrder to allow OPEN or SERVED
old_line = "if (order.status !== 'SERVED') {"
new_line = "if (order.status !== 'SERVED' && order.status !== 'OPEN') {"
code = code.replace(old_line, new_line)

with open('apps/api/src/modules/pos/pos.service.ts', 'w', encoding='utf-8') as f:
    f.write(code)

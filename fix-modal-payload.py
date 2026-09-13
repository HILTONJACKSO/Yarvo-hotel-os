import sys

with open('apps/web/src/components/reservations/NewReservationModal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    'if (!payload.companyId) {\n        delete payload.companyId;\n      }',
    'if (!payload.companyId) {\n        delete payload.companyId;\n      }\n      if (!payload.roomId) {\n        delete payload.roomId;\n      }'
)

with open('apps/web/src/components/reservations/NewReservationModal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

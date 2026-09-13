import sys

with open('apps/web/src/app/dashboard/front-desk/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    'arrData.data.filter(r => ',
    'arrData.data.filter((r: any) => '
)
code = code.replace(
    'inHouseData.data.filter(r => ',
    'inHouseData.data.filter((r: any) => '
)

with open('apps/web/src/app/dashboard/front-desk/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

import sys
import re

with open('apps/web/src/app/dashboard/layout.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "<img src=\"/logo.jpg\" alt=\"Yarvo Logo\" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />",
    "<img src=\"/logo.jpg\" alt=\"Yarvo Logo\" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '50%' }} />"
)

with open('apps/web/src/app/dashboard/layout.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

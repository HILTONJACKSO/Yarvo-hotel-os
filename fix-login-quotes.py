import sys

with open('apps/web/src/app/login/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("\\'", "'")
code = code.replace(
    "<img src=\"/logo.jpg\" alt=\"Yarvo Logo\" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />",
    "<img src=\"/logo.jpg\" alt=\"Yarvo Logo\" style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '50%' }} />"
)

with open('apps/web/src/app/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

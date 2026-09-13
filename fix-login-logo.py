import sys
import re

with open('apps/web/src/app/login/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(
    r'<div className="form-logo-sm">.*?</div>',
    r'<div className="form-logo-sm" style={{ background: \'none\', border: \'none\' }}><img src="/logo.jpg" alt="Logo" style={{ width: \'48px\', height: \'48px\', borderRadius: \'50%\' }} /></div>',
    code,
    flags=re.DOTALL
)

with open('apps/web/src/app/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

import sys

with open('apps/web/src/app/login/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('<h1 className="brand-name">Kwalee</h1>', '<h1 className="brand-name">KWALEE</h1>')
code = code.replace('<p className="form-subtitle">Sign in to continue to Kwalee HMS</p>', '<p className="form-subtitle">Sign in to continue to KWALEE HMS</p>')
code = code.replace('admin@kwalee.com', 'admin@kwalee.com') # I'll keep email lowercase

with open('apps/web/src/app/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

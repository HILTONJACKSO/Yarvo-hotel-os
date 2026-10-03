import os
import re

path = "apps/web/src/app/dashboard/pos/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

pattern = re.compile(r'(<option value="DRINK">Drink</option>)')

def repl(m):
    return m.group(1) + '\n                    <option value="MERCHANDISE">Merchandise</option>'

c, num = pattern.subn(repl, c)

if num > 0:
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched POS add menu item type dropdown")
else:
    print("Regex failed")

import os
import re
page_path = "apps/web/src/app/dashboard/pos/page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    c = f.read()

pattern = re.compile(r'(placeholder="0"\s*/>\s*)(</div>)', re.DOTALL)

def repl(m):
    return m.group(1) + """{settleDiscountPercent > 0 && (
                            <input
                              type="text"
                              value={settleDiscountReason}
                              onChange={e => setSettleDiscountReason(e.target.value)}
                              style={{ width: '120px', background: 'hsl(222, 35%, 15%)', border: '1px solid hsl(217, 20%, 25%)', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85rem' }}
                              placeholder="Reason"
                              required
                            />
                          )}\n                        """ + m.group(2)

c, num = pattern.subn(repl, c)

if num > 0:
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched pos/page.tsx UI using precise regex!")
else:
    print("Failed")

import os

page_path = "apps/web/src/app/dashboard/pos/page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    c = f.read()

import re

# Add state
c = re.sub(
    r"const \[settleDiscountPercent, setSettleDiscountPercent\] = useState<number>\(0\);",
    r"const [settleDiscountPercent, setSettleDiscountPercent] = useState<number>(0);\n    const [settleDiscountReason, setSettleDiscountReason] = useState<string>('');",
    c
)

# Update handleSettle payload
c = re.sub(
    r"if \(settleDiscountAmount > 0\) payload\.discountAmount = settleDiscountAmount;",
    r"if (settleDiscountAmount > 0) { payload.discountAmount = settleDiscountAmount; payload.discountReason = settleDiscountReason || 'POS Discount'; }",
    c
)

# Reset state on success and cancel
c = re.sub(
    r"setSettleDiscountPercent\(0\);",
    r"setSettleDiscountPercent(0); setSettleDiscountReason('');",
    c
)

# Add input in the UI
old_ui = """                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.9rem', color: 'hsl(215, 20%, 65%)' }}>Discount (%):</span>
                          <input 
                            type="number" 
                            step="1"
                            max="100"
                            value={settleDiscountPercent || ''} 
                            onChange={e => setSettleDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))} 
                            style={{ width: '60px', background: 'hsl(222, 35%, 15%)', border: '1px solid hsl(217, 20%, 25%)', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85rem', textAlign: 'right' }} 
                            placeholder="0"
                          />
                        </div>"""

new_ui = """                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.9rem', color: 'hsl(215, 20%, 65%)' }}>Discount (%):</span>
                          <input 
                            type="number" 
                            step="1"
                            max="100"
                            value={settleDiscountPercent || ''} 
                            onChange={e => setSettleDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))} 
                            style={{ width: '60px', background: 'hsl(222, 35%, 15%)', border: '1px solid hsl(217, 20%, 25%)', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85rem', textAlign: 'right' }} 
                            placeholder="0"
                          />
                          {settleDiscountPercent > 0 && (
                            <input
                              type="text"
                              value={settleDiscountReason}
                              onChange={e => setSettleDiscountReason(e.target.value)}
                              style={{ width: '120px', background: 'hsl(222, 35%, 15%)', border: '1px solid hsl(217, 20%, 25%)', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85rem' }}
                              placeholder="Reason"
                              required
                            />
                          )}
                        </div>"""

if old_ui in c:
    c = c.replace(old_ui, new_ui)
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched pos/page.tsx")
else:
    print("Failed to patch ui in pos/page.tsx")

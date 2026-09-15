import sys

with open("apps/web/src/app/dashboard/cashier/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_price = "? `-$${(Number(item.menuItem.price) * item.quantity).toFixed(2)}`"
new_price = "? `$0.00`"
code = code.replace(old_price, new_price)

old_html_price = """<span className="price">{isReturned ? '-' : ''}${(Number(item.menuItem.price) * item.quantity).toFixed(2)}</span>"""
new_html_price = """<span className="price">{isReturned ? '$0.00' : `$${(Number(item.menuItem.price) * item.quantity).toFixed(2)}`}</span>"""
code = code.replace(old_html_price, new_html_price)

with open("apps/web/src/app/dashboard/cashier/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

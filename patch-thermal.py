path = "apps/web/src/components/front-desk/CheckOutModal.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

search_str = """          </div>
          <div style="text-align:center; font-size:14px; font-weight:bold; margin:20px 0; color:#000;">ROOM INVOICE</div>
          <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>"""

replace_str = """          </div>
          <div style="text-align:center; font-size:14px; font-weight:bold; margin:20px 0; color:#000; text-transform: uppercase;">
            ${statement?.reservation?.room?.number?.toLowerCase().includes('tent') ? 'TENT INVOICE' : 'ROOM INVOICE'}
          </div>
          <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>"""

c = c.replace(search_str, replace_str)
with open(path, "w", encoding="utf-8") as f:
    f.write(c)

path2 = "apps/web/src/app/dashboard/billing/page.tsx"
with open(path2, "r", encoding="utf-8") as f:
    c2 = f.read()

search_str2 = """          </div>
          <div style="text-align:center; font-size:14px; font-weight:bold; margin:20px 0; color:#000;">${mode === 'RECEIPT' ? 'ROOM RECEIPT' : 'ROOM INVOICE'}</div>
          <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>"""

replace_str2 = """          </div>
          <div style="text-align:center; font-size:14px; font-weight:bold; margin:20px 0; color:#000; text-transform: uppercase;">
            ${selectedBill.reservation?.room?.number?.toLowerCase().includes('tent') ? (mode === 'RECEIPT' ? 'TENT RECEIPT' : 'TENT INVOICE') : (mode === 'RECEIPT' ? 'ROOM RECEIPT' : 'ROOM INVOICE')}
          </div>
          <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>"""

c2 = c2.replace(search_str2, replace_str2)
with open(path2, "w", encoding="utf-8") as f:
    f.write(c2)

print("Patched thermal receipts")

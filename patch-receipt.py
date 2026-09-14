import sys

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_func_def = "const printViaIframe = () => {"
new_func_def = "const printViaIframe = (mode: 'RECEIPT' | 'INVOICE' = 'INVOICE') => {"
code = code.replace(old_func_def, new_func_def)

old_title = """<div style="text-align:center; font-size:14px; font-weight:bold; margin:20px 0; color:#000;">ROOM INVOICE</div>"""
new_title = """<div style="text-align:center; font-size:14px; font-weight:bold; margin:20px 0; color:#000;">${mode === 'RECEIPT' ? 'ROOM RECEIPT' : 'ROOM INVOICE'}</div>"""
code = code.replace(old_title, new_title)

old_button = """<button onClick={printViaIframe} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Invoice</button>"""
new_buttons = """<div className="flex gap-2 justify-end mt-2">
                      <button onClick={() => printViaIframe('RECEIPT')} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Receipt</button>
                      <button onClick={() => printViaIframe('INVOICE')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Invoice</button>
                    </div>"""
code = code.replace(old_button, new_buttons)

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

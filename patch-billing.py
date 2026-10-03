import re

path = "apps/web/src/app/dashboard/billing/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

pattern1 = r"\{selectedBill\.reservation\?\.guest\?\.lastName\} Folio"
replace1 = "Bill: {selectedBill.reservation?.guest?.lastName}"

pattern2 = r"\{selectedBill\.status === 'OPEN' && Number\(selectedBill\.balance\) === 0 && \(\s*<button onClick=\{handleCloseFolio\} className=\"bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1\.5 rounded-md transition-colors\">Close Bill</button>\s*\)\}"

replace2 = """{selectedBill.status === 'OPEN' && (
                          <button onClick={handleCloseFolio} disabled={Number(selectedBill.balance) !== 0} className={`text-xs px-3 py-1.5 rounded-md transition-colors ${Number(selectedBill.balance) === 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>Close Bill</button>
                        )}"""

if re.search(pattern1, c) and re.search(pattern2, c):
    c = re.sub(pattern1, replace1, c)
    c = re.sub(pattern2, replace2, c)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched billing page via regex")
else:
    print("Could not find regex patterns")

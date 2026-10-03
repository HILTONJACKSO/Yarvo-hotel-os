path = "apps/web/src/app/dashboard/inventory/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

import re
c = re.sub(
    r"<label>Record Date</label>\s*<input type=\"date\" value=\{printReportDate\} onChange=\{e => setPrintReportDate\(e\.target\.value\)\} className=\"form-control w-full\" />",
    "<label>Start Date</label>\n                <input type=\"date\" value={printReportDate} onChange={e => setPrintReportDate(e.target.value)} className=\"form-control w-full\" />\n              </div>\n              <div className=\"form-group\">\n                <label>End Date</label>\n                <input type=\"date\" value={printEndDate} onChange={e => setPrintEndDate(e.target.value)} className=\"form-control w-full\" />",
    c
)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)
    
print("Patched inputs")

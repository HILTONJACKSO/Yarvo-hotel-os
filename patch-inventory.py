path = "apps/web/src/app/dashboard/inventory/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

import re

# Add printEndDate state
c = re.sub(
    r"const \[printReportDate, setPrintReportDate\] = useState\(new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\);",
    "const [printReportDate, setPrintReportDate] = useState(new Date().toISOString().split('T')[0]);\n  const [printEndDate, setPrintEndDate] = useState(new Date().toISOString().split('T')[0]);",
    c
)

# Update modal inputs
search_inputs = """              <div className="form-group">
                <label>Record Date</label>
                <input type="date" value={printReportDate} onChange={e => setPrintReportDate(e.target.value)} className="form-control w-full" />
              </div>"""

replace_inputs = """              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={printReportDate} onChange={e => setPrintReportDate(e.target.value)} className="form-control w-full" />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={printEndDate} onChange={e => setPrintEndDate(e.target.value)} className="form-control w-full" />
              </div>"""

c = c.replace(search_inputs, replace_inputs)

# Update printing formatting
search_header = "<h2>${printReportPeriod} Record - Date: ${printReportDate}</h2>"

replace_header = """<h2>${printReportPeriod} Record - Date: ${(() => {
          const s = printReportDate.split('-');
          const e = printEndDate.split('-');
          if (s[0] === e[0] && s[1] === e[1]) {
            return `${s[0]}, ${s[1]}, ${s[2]} - ${e[2]}`;
          }
          return `${printReportDate} to ${printEndDate}`;
        })()}</h2>"""

c = c.replace(search_header, replace_header)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)
    
print("Patched inventory print modal and rendering")

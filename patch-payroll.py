path = "apps/web/src/components/staff/PayrollTab.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("""          <div className="flex gap-2">
            {isManagerOrAdmin && (
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium" onClick={handleGenerateAll}>
                Auto-Generate Drafts
              </button>
            )}
            <button className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-medium" onClick={handlePrintSummary} disabled={!summary}>
              Print Summary (A4)
            </button>
          </div>""", 
"""          <div className="flex gap-2">
            {isManagerOrAdmin && (
              <>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium" onClick={handleGenerateAll}>
                  Auto-Generate Drafts
                </button>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-medium" onClick={handlePrintSummary} disabled={!summary}>
                  Print Summary (A4)
                </button>
              </>
            )}
          </div>""")

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("Updated PayrollTab.tsx")

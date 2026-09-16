import sys
import re

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add handleCloseFolio function
handler = """
  const handleCloseFolio = async () => {
    if (!selectedBill || selectedBill.type !== "FOLIO") return;
    if (!confirm("Are you sure you want to close this folio?")) return;
    try {
      const res = await fetch(`/api/v1/folios/${selectedBill.id}/close`, { method: "POST" });
      if (res.ok) {
        showToast("Folio closed successfully!", "success");
        setSelectedBill(null);
        fetchBills();
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to close folio", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
    }
  };

  const handlePostCharge = async (e: React.FormEvent) => {
"""
code = code.replace("  const handlePostCharge = async (e: React.FormEvent) => {", handler)


# Add button to UI
old_buttons = """                        <button onClick={() => printViaIframe('RECEIPT')} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Receipt</button>
                        <button onClick={() => printViaIframe('INVOICE')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Invoice</button>"""

new_buttons = """                        {selectedBill.status === 'OPEN' && Number(selectedBill.balance) === 0 && (
                          <button onClick={handleCloseFolio} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Close Folio</button>
                        )}
                        <button onClick={() => printViaIframe('RECEIPT')} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Receipt</button>
                        <button onClick={() => printViaIframe('INVOICE')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Invoice</button>"""

code = code.replace(old_buttons, new_buttons)

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

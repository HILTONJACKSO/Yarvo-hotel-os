import sys
import re

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add states
state_addition = """  const [paymentMethod, setPaymentMethod] = useState("PAYMENT_CARD");
  const [paymentAmount, setPaymentAmount] = useState("");
  
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountDescription, setDiscountDescription] = useState("");
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
"""
code = code.replace("  const [paymentMethod, setPaymentMethod] = useState(\"PAYMENT_CARD\");\n  const [paymentAmount, setPaymentAmount] = useState(\"\");", state_addition)

# Modify handleCloseFolio
old_handle_close = """  const handleCloseFolio = async () => {
    if (!selectedBill || selectedBill.type !== "FOLIO") return;
    if (!confirm("Are you sure you want to close this folio?")) return;
    try {"""

new_handle_close = """  const handleCloseFolio = () => setIsCloseModalOpen(true);

  const confirmCloseFolio = async () => {
    if (!selectedBill || selectedBill.type !== "FOLIO") return;
    try {"""
code = code.replace(old_handle_close, new_handle_close)

old_handle_close_end = """        fetchBills();
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to close folio", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
    }
  };"""

new_handle_close_end = """        fetchBills();
        setIsCloseModalOpen(false);
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to close folio", "error");
        setIsCloseModalOpen(false);
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
      setIsCloseModalOpen(false);
    }
  };"""
code = code.replace(old_handle_close_end, new_handle_close_end)


# Add postDiscount handler
post_discount_handler = """
  const handlePostDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || selectedBill.type !== "FOLIO") return;
    try {
      const res = await fetch(`/api/v1/folios/${selectedBill.id}/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(discountAmount), description: discountDescription || "Discount", category: "OTHER" }),
      });
      if (res.ok) {
        showToast("Discount posted successfully!", "success");
        setDiscountAmount("");
        setDiscountDescription("");
        selectFolio(selectedBill.id);
        fetchBills();
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to post discount", "error");
      }
    } catch (error) {
      showToast("Network error.", "error");
    }
  };
"""
code = code.replace("  const handlePostCharge = async (e: React.FormEvent) => {", post_discount_handler + "\n  const handlePostCharge = async (e: React.FormEvent) => {")

# Add discount form UI
old_forms = """                    <form onSubmit={handlePostPayment} className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-xl flex flex-col gap-3">
                      <h4 className="font-bold text-slate-200">Post Payment</h4>"""

new_forms = """                    <form onSubmit={handlePostDiscount} className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-xl flex flex-col gap-3">
                      <h4 className="font-bold text-slate-200">Post Discount</h4>
                      <input type="text" placeholder="Description (e.g. Service Apology)" value={discountDescription} onChange={e => setDiscountDescription(e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-cyan-500" required />
                      <input type="number" step="0.01" min="0.01" placeholder="Amount ($)" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-cyan-500" required />
                      <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg transition-colors mt-auto shadow-lg shadow-amber-900/20">Add Discount</button>
                    </form>
                    <form onSubmit={handlePostPayment} className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-xl flex flex-col gap-3">
                      <h4 className="font-bold text-slate-200">Post Payment</h4>"""
code = code.replace(old_forms, new_forms)

# Add modal to bottom of JSX
modal_jsx = """      {/* Close Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 p-7 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><Receipt size={24} className="text-emerald-400" /> Close Folio</h3>
            <p className="text-slate-300 mb-6 text-sm">Are you sure you want to close this folio? This action cannot be undone, and no further charges or payments can be posted.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsCloseModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">Cancel</button>
              <button onClick={confirmCloseFolio} className="px-4 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-lg shadow-emerald-900/30">Yes, Close Folio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}"""
code = code.replace("    </div>\n  );\n}", modal_jsx)

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

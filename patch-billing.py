import sys
import re

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update the Print Invoice button
old_button = """                  <button onClick={() => window.open(`/invoice/${selectedBill.id}`, '_blank')} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Invoice</button>"""
new_button = """                  <button onClick={printViaIframe} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Invoice</button>"""
code = code.replace(old_button, new_button)

# 2. Add printViaIframe function
print_logic = """  const printViaIframe = () => {
    if (!selectedBill) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    let itemsHtml = '';
    selectedBill.lineItems.forEach((item: any) => {
      const typeStr = item.type === 'CHARGE' ? 'Charge' : 'Payment';
      const amountStr = item.type === 'CHARGE' ? `$${Number(item.amount).toFixed(2)}` : `-$${Number(item.amount).toFixed(2)}`;
      itemsHtml += `
        <div class="summary-row" style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px; font-family:monospace; color:#000;">
          <span style="flex:1;">${new Date(item.createdAt).toLocaleDateString()} ${item.description.substring(0, 20)}</span>
          <span style="font-weight:500;">${amountStr}</span>
        </div>
      `;
    });

    const docHtml = `
      <html><head><title>Folio Invoice</title></head>
      <body style="margin:0; padding:20px; font-family:'Courier New', Courier, monospace; color:#000; background:#fff;">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="/kwalee-logo.png" style="max-width:120px; margin-bottom:10px;" />
          <div style="font-size:20px; font-weight:bold; margin-bottom:4px;">KWAALEE BEACH RESORT</div>
          <div style="font-size:12px;">www.kwaleebeachresort.com</div>
          <div style="font-size:12px;">+231 774 340 843 / +231 881 774 350</div>
          <div style="font-size:12px;">Kpakpa Kon, Marshall</div>
          <div style="font-size:12px;">Lower Margibi County, Liberia</div>
        </div>
        <div style="text-align:center; font-size:14px; font-weight:bold; margin:20px 0;">FOLIO INVOICE</div>
        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        
        <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; color:#000;">
          <span>Folio No:</span><span>FL-${selectedBill.id.substring(0,6).toUpperCase()}</span>
        </div>
        <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; color:#000;">
          <span>Date:</span><span>${new Date().toLocaleDateString()}</span>
        </div>
        <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; color:#000;">
          <span>Guest:</span><span>${selectedBill.reservation.guest.firstName} ${selectedBill.reservation.guest.lastName}</span>
        </div>
        <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; color:#000;">
          <span>Room:</span><span>${selectedBill.reservation.room?.number || 'N/A'}</span>
        </div>
        
        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        ${itemsHtml}
        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        
        <div style="font-size:18px; font-weight:bold; display:flex; justify-content:space-between; margin-top:12px; color:#000;">
          <span>BALANCE DUE</span><span>$${Number(selectedBill.balance).toFixed(2)}</span>
        </div>

        <div style="margin-top:50px; text-align:center;">
          <div style="border-top:1px solid #000; width:200px; margin:0 auto 8px auto;"></div>
          <p style="font-size:12px; margin:0; color:#000;">Guest Signature</p>
        </div>

        <div style="text-align:center; font-size:11px; margin-top:40px; color:#000;">
          <p><strong>THANK YOU FOR CHOOSING KWAALEE BEACH RESORT!</strong></p>
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(docHtml);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }, 250);
  };
"""

# Insert `printViaIframe` right after `const handlePostPayment = async (e: React.FormEvent) => { ... }`
# Wait, let's just put it before `const fetchFolios = async () => {`
code = code.replace("  const fetchFolios = async () => {", print_logic + "\n  const fetchFolios = async () => {")

# 3. Add TAX to charge category options
old_charge = """<option value="ROOM">Room Rate</option><option value="F_AND_B">Food & Beverage</option><option value="LAUNDRY">Laundry</option><option value="SPA">Spa</option>"""
new_charge = """<option value="ROOM">Room Rate</option><option value="F_AND_B">Food & Beverage</option><option value="LAUNDRY">Laundry</option><option value="SPA">Spa</option><option value="TAX">GST / Tax</option><option value="OTHER">Other</option>"""
code = code.replace(old_charge, new_charge)

# 4. Add DISCOUNT to payment options
old_payment = """<option value="PAYMENT_CARD">Credit Card</option>
                          <option value="PAYMENT_CASH">Cash</option>
                          <option value="PAYMENT_MOBILE">Mobile Money</option>
                          <option value="PAYMENT_BANK">Bank Transfer</option>"""
new_payment = """<option value="PAYMENT_CARD">Credit Card</option>
                          <option value="PAYMENT_CASH">Cash</option>
                          <option value="PAYMENT_MOBILE">Mobile Money</option>
                          <option value="PAYMENT_BANK">Bank Transfer</option>
                          <option value="OTHER">Discount / Adjustment</option>"""
code = code.replace(old_payment, new_payment)

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

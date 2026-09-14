import sys

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_header = """        <div style="text-align:center; margin-bottom:20px;">
          <img src="/kwalee-logo.png" style="max-width:120px; margin-bottom:10px;" />
          <div style="font-size:20px; font-weight:bold; margin-bottom:4px; color:#000;">KWAALEE BEACH RESORT</div>
          <div style="font-size:12px; color:#000;">www.kwaleebeachresort.com</div>
        </div>
        <div style="text-align:center; font-size:14px; font-weight:bold; margin:20px 0; color:#000;">FOLIO INVOICE</div>
        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        
        <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; color:#000;">
          <span style="color:#666;">Folio No:</span><span>FL-${selectedBill.id.substring(0,6).toUpperCase()}</span>
        </div>"""

new_header = """        <div style="text-align:center; margin-bottom:20px;">
          <img src="/kwalee-logo.png" style="max-width:120px; margin-bottom:10px;" />
          <div style="font-size:20px; font-weight:bold; margin-bottom:4px; color:#000;">KWAALEE BEACH RESORT</div>
          <div style="font-size:12px; color:#000;">www.kwaleebeachresort.com</div>
          <div style="font-size:12px; color:#000;">info@kwaleebeachresort.com</div>
          <div style="font-size:12px; color:#000;">+231 774 340 843 / +231 881 774 350</div>
          <div style="font-size:12px; color:#000;">Kpakpa Kon, Marshall, Lower Margibi County, Liberia</div>
        </div>
        <div style="text-align:center; font-size:14px; font-weight:bold; margin:20px 0; color:#000;">ROOM INVOICE</div>
        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        
        <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; color:#000;">
          <span style="color:#666;">Invoice No:</span><span>FL-${selectedBill.id.substring(0,6).toUpperCase()}</span>
        </div>"""

old_footer = """        <div style="text-align:center; font-size:11px; margin-top:40px; color:#333; line-height:1.5;">
          <p style="color:#000;"><strong>THANK YOU FOR CHOOSING KWAALEE BEACH RESORT!</strong><br/>PLEASE COME AGAIN!</p>
        </div>"""

new_footer = """        <div style="text-align:center; font-size:11px; margin-top:40px; color:#333; line-height:1.5;">
          <p style="color:#000;"><strong>THANK YOU FOR CHOOSING KWAALEE BEACH RESORT!</strong><br/>PLEASE COME AGAIN!</p>
        </div>
        
        <div style="text-align:left; font-size:10px; margin-top:20px; color:#000; line-height:1.4; border-top:1px dashed #000; padding-top:10px;">
          <strong>PAYMENT TERMS & CONDITIONS:</strong><br/>
          Payment is due immediately upon receipt of this invoice unless otherwise agreed. All prices are subject to applicable charges. Any additional orders or services will be added to the final bill.
          <br/><br/>
          Thank you for choosing Kwalee Beach Resort.
        </div>"""

code = code.replace(old_header, new_header)
code = code.replace(old_footer, new_footer)

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

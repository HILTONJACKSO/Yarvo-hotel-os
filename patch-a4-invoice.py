path = "apps/web/src/app/invoice/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

import re

# Fix math
c = re.sub(r"const subtotal = totalCharges \/ 1\.10;", "const subtotal = totalCharges;", c)
c = re.sub(r"const gst = totalCharges - subtotal;", "const gst = totalCharges - (totalCharges / 1.10);", c)

# Fix title & labels
c = re.sub(
    r"<h3>Invoice Details:</h3>",
    "<h3>{folio.reservation.room?.number?.toLowerCase().includes('tent') ? 'TENT INVOICE' : 'ROOM INVOICE'}:</h3>",
    c
)

c = re.sub(
    r"<tr><td>Room:</td><td>\{folio\.reservation\.room\?\.number \|\| 'N/A'\}</td></tr>",
    "<tr><td>{folio.reservation.room?.number?.toLowerCase().includes('tent') ? 'Tent' : 'Room'}:</td><td>{folio.reservation.room?.number || 'N/A'}</td></tr>",
    c
)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)
print("Patched A4 invoice math and tent labeling.")

import sys
import re

with open("apps/web/src/app/dashboard/cashier/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add state update to PDF download
old_download_pdf = """        const endpoint = isInvoice ? 'increment-print' : 'increment-receipt-print';
        await fetch(`${API_URL}/api/v1/pos/orders/${orderId}/${endpoint}`, { method: 'POST', credentials: 'include' });
        fetchOrders();
      } catch (err) {"""

new_download_pdf = """        const endpoint = isInvoice ? 'increment-print' : 'increment-receipt-print';
        setSelectedOrder(prev => prev ? { ...prev, [isInvoice ? 'invoicePrintCount' : 'receiptPrintCount']: (prev[isInvoice ? 'invoicePrintCount' : 'receiptPrintCount'] || 0) + 1 } : null);
        await fetch(`${API_URL}/api/v1/pos/orders/${orderId}/${endpoint}`, { method: 'POST', credentials: 'include' });
        fetchOrders();
      } catch (err) {"""

code = code.replace(old_download_pdf, new_download_pdf)

with open("apps/web/src/app/dashboard/cashier/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

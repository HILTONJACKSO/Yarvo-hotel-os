import sys
import re

with open("apps/web/src/app/dashboard/cashier/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_pdf = """    const downloadReceiptPdf = async (orderId: string, isInvoice: boolean = false) => {
      if (!selectedOrder) return;
      
      const isStaff = currentUser?.roles?.some((r: any) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
      const isManager = currentUser?.roles?.some((r: any) => ['MANAGER'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
      
      if (isInvoice) {
        if (isStaff && selectedOrder.invoicePrintCount >= 1) {
          showToast('Staff can only print an invoice once. Please contact management.', 'error');
          return;
        }
        if (isManager && selectedOrder.invoicePrintCount >= 3) {
          showToast('Manager can only print an invoice 3 times. Please contact CEO.', 'error');
          return;
        }
      } else {
        if (isStaff && selectedOrder.receiptPrintCount >= 1) {
          showToast('Staff can only print a receipt once. Please contact management.', 'error');
          return;
        }
        if (isManager && selectedOrder.receiptPrintCount >= 3) {
          showToast('Manager can only print a receipt 3 times. Please contact CEO.', 'error');
          return;
        }
      }"""

new_pdf = """    const downloadReceiptPdf = async (orderId: string, isInvoice: boolean = false) => {
      if (!selectedOrder) return;
      
      const getRoles = (user: any) => user?.roles?.map((r: any) => (r.name || r).toUpperCase()) || [];
      const roles = getRoles(currentUser);
      const isAdmin = roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r));
      const isManager = roles.includes('MANAGER');
      const isStaff = roles.some((r: string) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN', 'POS_CASHIER'].includes(r));
      
      if (!isAdmin) {
        if (isInvoice) {
          if (isManager && selectedOrder.invoicePrintCount >= 3) {
            showToast('Manager can only print an invoice 3 times. Please contact CEO.', 'error');
            return;
          }
          if (!isManager && isStaff && selectedOrder.invoicePrintCount >= 1) {
            showToast('Staff can only print an invoice once. Please contact management.', 'error');
            return;
          }
        } else {
          if (isManager && selectedOrder.receiptPrintCount >= 3) {
            showToast('Manager can only print a receipt 3 times. Please contact CEO.', 'error');
            return;
          }
          if (!isManager && isStaff && selectedOrder.receiptPrintCount >= 1) {
            showToast('Staff can only print a receipt once. Please contact management.', 'error');
            return;
          }
        }
      }"""

code = code.replace(old_pdf, new_pdf)


with open("apps/web/src/app/dashboard/cashier/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

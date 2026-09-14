import sys
import re

with open("apps/web/src/app/dashboard/cashier/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Replace handlePrintInvoice
old_invoice = """  const handlePrintInvoice = async (orderId: string) => {
    if (!selectedOrder) return;
    const isStaff = currentUser?.roles?.some((r: any) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
    const isManager = currentUser?.roles?.some((r: any) => ['MANAGER'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
    
    if (isStaff && selectedOrder.invoicePrintCount >= 1) {
      showToast('Staff can only print an invoice once. Please contact management.', 'error');
      return;
    }
    if (isManager && selectedOrder.invoicePrintCount >= 3) {
      showToast('Manager can only print an invoice 3 times. Please contact CEO.', 'error');
      return;
    }
    
    printViaIframe('INVOICE');
    try {
      await fetch(`${API_URL}/api/v1/pos/orders/${orderId}/increment-print`, { method: 'POST', credentials: 'include' });
      fetchOrders();
    } catch(e) {}
  };"""

new_invoice = """  const handlePrintInvoice = async (orderId: string) => {
    if (!selectedOrder) return;
    const getRoles = (user: any) => user?.roles?.map((r: any) => (r.name || r).toUpperCase()) || [];
    const roles = getRoles(currentUser);
    const isAdmin = roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r));
    const isManager = roles.includes('MANAGER');
    const isStaff = roles.some((r: string) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN', 'POS_CASHIER'].includes(r));
    
    if (!isAdmin) {
      if (isManager && selectedOrder.invoicePrintCount >= 3) {
        showToast('Manager can only print an invoice 3 times. Please contact CEO.', 'error');
        return;
      }
      if (!isManager && isStaff && selectedOrder.invoicePrintCount >= 1) {
        showToast('Staff can only print an invoice once. Please contact management.', 'error');
        return;
      }
    }
    
    printViaIframe('INVOICE');
    setSelectedOrder(prev => prev ? { ...prev, invoicePrintCount: (prev.invoicePrintCount || 0) + 1 } : null);
    try {
      await fetch(`${API_URL}/api/v1/pos/orders/${orderId}/increment-print`, { method: 'POST', credentials: 'include' });
      fetchOrders();
    } catch(e) {}
  };"""

code = code.replace(old_invoice, new_invoice)


# Replace handlePrintReceipt
old_receipt = """  const handlePrintReceipt = async (orderId: string) => {
    if (!selectedOrder) return;
    const isStaff = currentUser?.roles?.some((r: any) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
    const isManager = currentUser?.roles?.some((r: any) => ['MANAGER'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
    
    if (isStaff && selectedOrder.receiptPrintCount >= 1) {
      showToast('Staff can only print a receipt once. Please contact management.', 'error');
      return;
    }
    if (isManager && selectedOrder.receiptPrintCount >= 3) {
      showToast('Manager can only print a receipt 3 times. Please contact CEO.', 'error');
      return;
    }
    
    printViaIframe('RECEIPT');
    try {
      await fetch(`${API_URL}/api/v1/pos/orders/${orderId}/increment-receipt-print`, { method: 'POST', credentials: 'include' });
      fetchOrders();
    } catch(e) {}
    };"""

new_receipt = """  const handlePrintReceipt = async (orderId: string) => {
    if (!selectedOrder) return;
    const getRoles = (user: any) => user?.roles?.map((r: any) => (r.name || r).toUpperCase()) || [];
    const roles = getRoles(currentUser);
    const isAdmin = roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r));
    const isManager = roles.includes('MANAGER');
    const isStaff = roles.some((r: string) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN', 'POS_CASHIER'].includes(r));
    
    if (!isAdmin) {
      if (isManager && selectedOrder.receiptPrintCount >= 3) {
        showToast('Manager can only print a receipt 3 times. Please contact CEO.', 'error');
        return;
      }
      if (!isManager && isStaff && selectedOrder.receiptPrintCount >= 1) {
        showToast('Staff can only print a receipt once. Please contact management.', 'error');
        return;
      }
    }
    
    printViaIframe('RECEIPT');
    setSelectedOrder(prev => prev ? { ...prev, receiptPrintCount: (prev.receiptPrintCount || 0) + 1 } : null);
    try {
      await fetch(`${API_URL}/api/v1/pos/orders/${orderId}/increment-receipt-print`, { method: 'POST', credentials: 'include' });
      fetchOrders();
    } catch(e) {}
  };"""

code = code.replace(old_receipt, new_receipt)

with open("apps/web/src/app/dashboard/cashier/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

import os
import re

path = "apps/web/src/app/dashboard/inventory/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# 1. Add state variables for Print Modal
state_injection = """  const [searchQuery, setSearchQuery] = useState('');

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printReportPeriod, setPrintReportPeriod] = useState('WEEKLY');
  const [printReportDate, setPrintReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [printLocation, setPrintLocation] = useState('ALL');

  const handlePrint = () => {
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

    let headersHtml = '';
    if (printLocation === 'ALL') {
      headersHtml = `<th>Item Name</th><th>Category</th><th>Unit</th><th>Main</th><th>Bar</th><th>Kitchen</th><th>Housekeeping</th><th>Boutique</th><th>Total</th>`;
    } else {
      headersHtml = `<th>Item Name</th><th>Category</th><th>Unit</th><th>${printLocation.charAt(0) + printLocation.slice(1).toLowerCase()} Stock</th>`;
    }

    let rowsHtml = '';
    // Sort items by category then name
    const sortedItems = [...items].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    sortedItems.forEach(item => {
      let cols = '';
      if (printLocation === 'ALL') {
        cols = `
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td>${item.unit}</td>
          <td>${Number(item.stockMain || 0).toFixed(2)}</td>
          <td>${Number(item.stockBar || 0).toFixed(2)}</td>
          <td>${Number(item.stockKitchen || 0).toFixed(2)}</td>
          <td>${Number(item.stockHousekeeping || 0).toFixed(2)}</td>
          <td>${Number(item.stockBoutique || 0).toFixed(2)}</td>
          <td><strong>${Number(item.stockLevel || 0).toFixed(2)}</strong></td>
        `;
      } else {
        let val = 0;
        if (printLocation === 'MAIN') val = Number(item.stockMain || 0);
        else if (printLocation === 'BAR') val = Number(item.stockBar || 0);
        else if (printLocation === 'KITCHEN') val = Number(item.stockKitchen || 0);
        else if (printLocation === 'HOUSEKEEPING') val = Number(item.stockHousekeeping || 0);
        else if (printLocation === 'BOUTIQUE') val = Number(item.stockBoutique || 0);

        cols = `
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td>${item.unit}</td>
          <td><strong>${val.toFixed(2)}</strong></td>
        `;
      }
      rowsHtml += `<tr>${cols}</tr>`;
    });

    doc.open();
    doc.write(`
      <html>
      <head>
        <title>Inventory Report</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
          h1 { text-align: center; margin-bottom: 5px; font-size: 24px; }
          h2 { text-align: center; margin-bottom: 20px; font-size: 16px; color: #666; font-weight: normal; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; text-transform: uppercase; }
          tr:nth-child(even) { background-color: #fafafa; }
        </style>
      </head>
      <body>
        <h1>Yarvo Resort - Inventory Report</h1>
        <h2>${printReportPeriod} Record - Date: ${printReportDate}</h2>
        <h2>Department: ${printLocation === 'ALL' ? 'All Departments' : printLocation}</h2>
        <table>
          <thead><tr>${headersHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => { document.body.removeChild(iframe); setShowPrintModal(false); }, 1000);
    }, 250);
  };
"""
c = re.sub(r"const \[searchQuery, setSearchQuery\] = useState\(''\);", state_injection, c)

# 2. Add Print button in header
header_btn_injection = """          {isAdmin && (
            <button className="btn-secondary" onClick={() => setShowPrintModal(true)}>
              Print Report
            </button>
          )}
          {isAdmin && (
            <button className="btn-primary" onClick="""
c = re.sub(r"\{\s*isAdmin && \(\s*<button className=\"btn-primary\" onClick=", header_btn_injection, c)

# 3. Add Print Modal JSX
modal_injection = """      {/* PRINT MODAL */}
      {showPrintModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3>Print Inventory Report</h3>
            <div className="form-group">
              <label>Report Period</label>
              <select value={printReportPeriod} onChange={e => setPrintReportPeriod(e.target.value)} className="form-select w-full">
                <option value="WEEKLY">Weekly Record</option>
                <option value="MONTHLY">Monthly Record</option>
                <option value="ANNUAL">Annual Record</option>
              </select>
            </div>
            <div className="form-group">
              <label>Record Date</label>
              <input type="date" value={printReportDate} onChange={e => setPrintReportDate(e.target.value)} className="form-control w-full" />
            </div>
            <div className="form-group">
              <label>Department / Location</label>
              <select value={printLocation} onChange={e => setPrintLocation(e.target.value)} className="form-select w-full">
                <option value="ALL">All Stock</option>
                <option value="MAIN">Main Stock</option>
                <option value="BAR">Bar Stock</option>
                <option value="KITCHEN">Kitchen Stock</option>
                <option value="HOUSEKEEPING">Housekeeping Stock</option>
                <option value="BOUTIQUE">Boutique Stock</option>
              </select>
            </div>
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn-cancel" onClick={() => setShowPrintModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handlePrint}>Print Now</button>
            </div>
          </div>
        </div>
      )}
      
      {showAddModal &&"""

c = c.replace("{showAddModal &&", modal_injection)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)
print("Patched inventory page with print functionality!")

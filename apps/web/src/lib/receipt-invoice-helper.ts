export interface ReceiptInvoiceSettings {
  businessName: string;
  tagline: string;
  logoUrl: string;
  showLogo: boolean;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxNumber: string;

  receipt: {
    title: string;
    prefix: string;
    headerNote: string;
    footerNote: string;
    terms: string;
    showTaxBreakdown: boolean;
    showServerName: boolean;
    showCustomerInfo: boolean;
    showTableNumber: boolean;
    paperWidth: '80mm' | '58mm';
  };

  invoice: {
    title: string;
    prefix: string;
    headerNote: string;
    footerNote: string;
    terms: string;
    bankDetails: string;
    showSignatureLine: boolean;
    showDueDate: boolean;
    showPaymentInstructions: boolean;
  };
}

export function getDefaultReceiptInvoiceSettings(property?: any): ReceiptInvoiceSettings {
  const parsedSettings: any = typeof property?.receiptSettings === 'string'
    ? (() => { try { return JSON.parse(property.receiptSettings); } catch { return {}; } })()
    : property?.receiptSettings || {};

  const propName = property?.name || 'Kwalee Beach Resort';
  const propLegal = property?.legalName || propName;
  const propAddress = property?.address || 'Marshall, Robertsfield Highway';
  const propCity = property?.city || 'Margibi / Monrovia';
  const propCountry = property?.country || 'Liberia';
  const propPhone = property?.phone || '+231 881 744 350';
  const propEmail = property?.email || 'kwaleebeachresort1@gmail.com';
  const propWebsite = property?.website || 'https://kwaleebeachresort.com';
  const propTaxId = property?.taxId || '';

  const legacyReceipt = parsedSettings.restaurant || parsedSettings.bar || {};
  const legacyInvoice = parsedSettings.invoice || {};

  return {
    businessName: parsedSettings.businessName ?? legacyReceipt.header?.split('\n')[0] ?? propName,
    tagline: parsedSettings.tagline ?? 'Luxury Coastal Escape & Resort',
    logoUrl: parsedSettings.logoUrl ?? legacyInvoice.logoUrl ?? legacyReceipt.logoUrl ?? (property?.logoUrl || '/kwalee-logo.png'),
    showLogo: parsedSettings.showLogo ?? true,
    address: parsedSettings.address ?? `${propAddress}, ${propCity}`,
    city: parsedSettings.city ?? propCity,
    country: parsedSettings.country ?? propCountry,
    phone: parsedSettings.phone ?? propPhone,
    email: parsedSettings.email ?? propEmail,
    website: parsedSettings.website ?? propWebsite,
    taxNumber: parsedSettings.taxNumber ?? legacyInvoice.taxNumber ?? legacyReceipt.taxNumber ?? propTaxId,

    receipt: {
      title: parsedSettings.receipt?.title ?? 'CUSTOMER RECEIPT',
      prefix: parsedSettings.receipt?.prefix ?? 'REC-',
      headerNote: parsedSettings.receipt?.headerNote ?? legacyReceipt.header ?? `Thank you for visiting ${propName}!`,
      footerNote: parsedSettings.receipt?.footerNote ?? legacyReceipt.footer ?? 'We appreciate your business! Please come again.',
      terms: parsedSettings.receipt?.terms ?? legacyReceipt.terms ?? 'Goods sold are not returnable after 24 hours. Retain this receipt for any inquiries or claims.',
      showTaxBreakdown: parsedSettings.receipt?.showTaxBreakdown ?? true,
      showServerName: parsedSettings.receipt?.showServerName ?? true,
      showCustomerInfo: parsedSettings.receipt?.showCustomerInfo ?? true,
      showTableNumber: parsedSettings.receipt?.showTableNumber ?? true,
      paperWidth: parsedSettings.receipt?.paperWidth ?? '80mm',
    },

    invoice: {
      title: parsedSettings.invoice?.title ?? 'GUEST FOLIO INVOICE',
      prefix: parsedSettings.invoice?.prefix ?? 'INV-',
      headerNote: parsedSettings.invoice?.headerNote ?? legacyInvoice.header ?? `Official Statement of Account — ${propLegal}`,
      footerNote: parsedSettings.invoice?.footerNote ?? legacyInvoice.footer ?? 'Thank you for staying with us. We hope you enjoyed your stay!',
      terms: parsedSettings.invoice?.terms ?? legacyInvoice.terms ?? 'Payment is due upon receipt. Late payments are subject to a 2% monthly service fee. Any damages to property will be assessed and billed accordingly.',
      bankDetails: parsedSettings.invoice?.bankDetails ?? 'Bank: Ecobank Liberia | Account No: 00123456789 | Mobile Money: 0777123456',
      showSignatureLine: parsedSettings.invoice?.showSignatureLine ?? true,
      showDueDate: parsedSettings.invoice?.showDueDate ?? true,
      showPaymentInstructions: parsedSettings.invoice?.showPaymentInstructions ?? true,
    },
  };
}

export function generateThermalReceiptHtml(options: {
  settings: ReceiptInvoiceSettings;
  orderId: string;
  orderDate?: string;
  destinationLabel?: string;
  serverName?: string;
  items: Array<{ name: string; quantity: number; price: string; total: string; isReturned?: boolean }>;
  subtotal: string;
  tax: string;
  taxLabel?: string;
  discount?: string;
  total: string;
  tendered?: string;
  change?: string;
  isInvoiceMode?: boolean;
}): string {
  const {
    settings,
    orderId,
    orderDate = new Date().toLocaleString(),
    destinationLabel,
    serverName,
    items,
    subtotal,
    tax,
    taxLabel = 'Tax / VAT (Included)',
    discount,
    total,
    isInvoiceMode = false,
  } = options;

  const width = settings.receipt.paperWidth === '58mm' ? '280px' : '360px';
  const title = isInvoiceMode ? (settings.invoice.title || 'CUSTOMER INVOICE') : (settings.receipt.title || 'CUSTOMER RECEIPT');

  let itemsHtml = '';
  items.forEach(item => {
    const isRet = item.isReturned;
    itemsHtml += `
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; ${isRet ? 'color: #dc2626; text-decoration: line-through;' : ''}">
        <div style="flex: 1; padding-right: 8px;">
          <span style="font-weight: bold; margin-right: 6px;">${item.quantity}x</span>
          <span>${item.name}${isRet ? ' (Returned)' : ''}</span>
        </div>
        <div style="text-align: right; white-space: nowrap; font-weight: 500;">
          ${item.total}
        </div>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title} #${orderId}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace;
            background: #fff;
            color: #000;
            margin: 0 auto;
            padding: 16px 10px;
            width: ${width};
            line-height: 1.35;
          }
          .header-center { text-align: center; margin-bottom: 12px; }
          .logo { max-width: 110px; max-height: 65px; object-fit: contain; margin: 0 auto 8px auto; display: block; }
          .biz-name { font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0 0 2px 0; letter-spacing: 0.5px; }
          .biz-tagline { font-size: 11px; font-style: italic; color: #444; margin: 0 0 4px 0; }
          .biz-contact { font-size: 11px; color: #333; margin: 1px 0; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; opacity: 0.8; }
          .double-divider { border-bottom: 2px solid #000; margin: 12px 0; }
          .doc-type { font-size: 15px; font-weight: 800; text-align: center; margin: 8px 0; letter-spacing: 1px; }
          .meta-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; color: #222; }
          .meta-row .label { color: #555; }
          .totals-row { display: flex; justify-content: space-between; font-size: 13px; margin-top: 5px; }
          .grand-total { display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; margin-top: 8px; padding-top: 6px; border-top: 1px solid #000; }
          .footer-note { text-align: center; font-size: 11px; margin-top: 16px; line-height: 1.4; color: #333; }
          .terms-block { font-size: 9px; color: #555; text-align: center; margin-top: 12px; border-top: 1px dashed #aaa; padding-top: 8px; line-height: 1.3; }
          .sig-box { margin-top: 30px; text-align: center; }
          .sig-line { border-top: 1px solid #000; width: 180px; margin: 0 auto 4px auto; }
          @media print {
            body { padding: 0; width: 100%; }
            @page { margin: 4mm; }
          }
        </style>
      </head>
      <body>
        <div class="header-center">
          ${settings.showLogo && settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" class="logo" />` : ''}
          <div class="biz-name">${settings.businessName}</div>
          ${settings.tagline ? `<div class="biz-tagline">${settings.tagline}</div>` : ''}
          ${settings.address ? `<div class="biz-contact">${settings.address}</div>` : ''}
          ${settings.phone ? `<div class="biz-contact">Tel: ${settings.phone}</div>` : ''}
          ${settings.email ? `<div class="biz-contact">${settings.email}</div>` : ''}
          ${settings.website ? `<div class="biz-contact">${settings.website}</div>` : ''}
          ${settings.taxNumber ? `<div class="biz-contact" style="font-weight: bold;">TIN/VAT: ${settings.taxNumber}</div>` : ''}
        </div>

        <div class="divider"></div>
        <div class="doc-type">${title}</div>

        <div class="meta-row">
          <span class="label">${isInvoiceMode ? 'INVOICE NO' : 'RECEIPT NO'}:</span>
          <span style="font-weight: bold;">#${(isInvoiceMode ? settings.invoice.prefix : settings.receipt.prefix)}${orderId.substring(0, 8).toUpperCase()}</span>
        </div>
        <div class="meta-row">
          <span class="label">DATE:</span>
          <span>${orderDate}</span>
        </div>
        ${settings.receipt.showTableNumber && destinationLabel ? `
          <div class="meta-row">
            <span class="label">DESTINATION:</span>
            <span style="font-weight: bold;">${destinationLabel}</span>
          </div>
        ` : ''}
        ${settings.receipt.showServerName && serverName ? `
          <div class="meta-row">
            <span class="label">SERVED BY:</span>
            <span>${serverName}</span>
          </div>
        ` : ''}

        <div class="divider"></div>

        ${itemsHtml}

        <div class="divider"></div>

        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${subtotal}</span>
        </div>

        ${settings.receipt.showTaxBreakdown && tax ? `
          <div class="totals-row" style="font-size: 11px; color: #555;">
            <span>${taxLabel}:</span>
            <span>${tax}</span>
          </div>
        ` : ''}

        ${discount ? `
          <div class="totals-row" style="color: #dc2626;">
            <span>Discount:</span>
            <span>-${discount}</span>
          </div>
        ` : ''}

        <div class="grand-total">
          <span>TOTAL:</span>
          <span>${total}</span>
        </div>

        ${isInvoiceMode && settings.invoice.showSignatureLine ? `
          <div class="sig-box">
            <div class="sig-line"></div>
            <div style="font-size: 11px;">Customer Signature</div>
          </div>
        ` : ''}

        ${settings.receipt.footerNote ? `
          <div class="footer-note">
            ${settings.receipt.footerNote.replace(/\n/g, '<br/>')}
          </div>
        ` : ''}

        ${settings.receipt.terms ? `
          <div class="terms-block">
            <strong>TERMS & CONDITIONS:</strong><br/>
            ${settings.receipt.terms.replace(/\n/g, '<br/>')}
          </div>
        ` : ''}
      </body>
    </html>
  `;
}

export function generateA4InvoiceHtml(options: {
  settings: ReceiptInvoiceSettings;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestAddress?: string;
  roomNumber?: string;
  checkInDate?: string;
  checkOutDate?: string;
  items: Array<{ date?: string; description: string; category?: string; amount: string }>;
  subtotal: string;
  tax: string;
  total: string;
  totalPaid?: string;
  balanceDue: string;
}): string {
  const {
    settings,
    invoiceNumber,
    invoiceDate,
    dueDate,
    guestName,
    guestEmail,
    guestPhone,
    guestAddress,
    roomNumber,
    checkInDate,
    checkOutDate,
    items,
    subtotal,
    tax,
    total,
    totalPaid,
    balanceDue,
  } = options;

  let rowsHtml = '';
  items.forEach((item, index) => {
    rowsHtml += `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 10px 14px; font-size: 12px; color: #475569;">${item.date || '-'}</td>
        <td style="padding: 10px 14px; font-size: 13px; font-weight: 500; color: #0f172a;">
          ${item.description}
          ${item.category ? `<span style="display: block; font-size: 11px; color: #64748b;">Category: ${item.category}</span>` : ''}
        </td>
        <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; text-align: right; color: #0f172a;">${item.amount}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice #${invoiceNumber} — ${settings.businessName}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #fff;
            margin: 0;
            padding: 40px;
            max-width: 820px;
            margin: 0 auto;
            line-height: 1.45;
          }
          .invoice-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #0f172a; padding-bottom: 24px; }
          .logo { max-width: 150px; max-height: 75px; object-fit: contain; margin-bottom: 12px; }
          .biz-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
          .biz-tagline { font-size: 13px; color: #64748b; font-style: italic; margin-bottom: 8px; }
          .biz-info { font-size: 12px; color: #334155; margin: 2px 0; }
          .doc-title-block { text-align: right; }
          .doc-heading { font-size: 28px; font-weight: 900; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.5px; }
          .doc-badge { display: inline-block; background: #0f172a; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; }
          
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; }
          .meta-card h4 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; }
          .meta-card p { margin: 2px 0; font-size: 13px; color: #0f172a; }
          .meta-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .meta-table td { padding: 3px 0; }
          .meta-table td:first-child { color: #64748b; width: 45%; }
          .meta-table td:last-child { font-weight: 600; color: #0f172a; }

          .table-header { background: #0f172a; color: #fff; font-size: 12px; text-transform: uppercase; font-weight: 600; }
          .table-header th { padding: 10px 14px; text-align: left; }
          .table-header th:last-child { text-align: right; }

          .totals-container { display: flex; justify-content: flex-end; margin-top: 24px; margin-bottom: 30px; }
          .totals-table { width: 320px; border-collapse: collapse; font-size: 13px; }
          .totals-table td { padding: 6px 10px; }
          .totals-table td:first-child { color: #64748b; }
          .totals-table td:last-child { text-align: right; font-weight: 600; color: #0f172a; }
          .grand-total-row { border-top: 2px solid #0f172a; font-size: 16px; font-weight: 800; }
          .grand-total-row td { padding-top: 10px; color: #0f172a !important; }

          .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .notes-box { font-size: 11px; line-height: 1.5; color: #475569; }
          .notes-box h5 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #0f172a; font-weight: 700; }
          .sig-line-a4 { border-top: 1px solid #0f172a; width: 220px; margin-top: 50px; text-align: center; padding-top: 6px; font-size: 11px; color: #334155; }

          @media print {
            body { padding: 0; max-width: 100%; }
            @page { margin: 15mm; size: A4; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-top">
          <div>
            ${settings.showLogo && settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" class="logo" />` : ''}
            <div class="biz-title">${settings.businessName}</div>
            ${settings.tagline ? `<div class="biz-tagline">${settings.tagline}</div>` : ''}
            ${settings.address ? `<div class="biz-info">${settings.address}</div>` : ''}
            ${settings.phone ? `<div class="biz-info">Phone: ${settings.phone}</div>` : ''}
            ${settings.email ? `<div class="biz-info">Email: ${settings.email}</div>` : ''}
            ${settings.website ? `<div class="biz-info">Web: ${settings.website}</div>` : ''}
            ${settings.taxNumber ? `<div class="biz-info"><strong>Tax ID / TIN:</strong> ${settings.taxNumber}</div>` : ''}
          </div>
          <div class="doc-title-block">
            <div class="doc-heading">${settings.invoice.title || 'INVOICE'}</div>
            <div class="doc-badge">#${settings.invoice.prefix}${invoiceNumber}</div>
            <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
              Date: <strong style="color: #0f172a;">${invoiceDate}</strong>
            </div>
            ${dueDate ? `
              <div style="font-size: 12px; color: #64748b;">
                Due Date: <strong style="color: #0f172a;">${dueDate}</strong>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-card">
            <h4>Billed To (Guest / Client):</h4>
            <p style="font-size: 15px; font-weight: 700;">${guestName}</p>
            ${guestEmail ? `<p>${guestEmail}</p>` : ''}
            ${guestPhone ? `<p>${guestPhone}</p>` : ''}
            ${guestAddress ? `<p>${guestAddress}</p>` : ''}
          </div>
          <div class="meta-card">
            <h4>Reservation Details:</h4>
            <table class="meta-table">
              <tbody>
                ${roomNumber ? `<tr><td>Assigned Room:</td><td>${roomNumber}</td></tr>` : ''}
                ${checkInDate ? `<tr><td>Check-In:</td><td>${checkInDate}</td></tr>` : ''}
                ${checkOutDate ? `<tr><td>Check-Out:</td><td>${checkOutDate}</td></tr>` : ''}
                <tr><td>Status:</td><td><span style="color: #16a34a; font-weight: 700;">Verified</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr class="table-header">
              <th style="width: 120px;">Date</th>
              <th>Description / Service</th>
              <th style="width: 140px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals-container">
          <table class="totals-table">
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td>${subtotal}</td>
              </tr>
              ${tax ? `
                <tr>
                  <td>Taxes & Fees:</td>
                  <td>${tax}</td>
                </tr>
              ` : ''}
              <tr class="grand-total-row">
                <td>Total Charges:</td>
                <td>${total}</td>
              </tr>
              ${totalPaid ? `
                <tr>
                  <td>Total Payments:</td>
                  <td style="color: #16a34a;">-${totalPaid}</td>
                </tr>
              ` : ''}
              <tr style="border-top: 1px solid #cbd5e1; font-weight: 800; font-size: 15px;">
                <td>Balance Due:</td>
                <td style="color: ${balanceDue === '$0.00' ? '#16a34a' : '#b91c1c'};">${balanceDue}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bottom-grid">
          <div class="notes-box">
            ${settings.invoice.showPaymentInstructions && settings.invoice.bankDetails ? `
              <h5>Payment Instructions / Bank Wire</h5>
              <p style="white-space: pre-line; margin-bottom: 12px; background: #f8fafc; padding: 8px 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
                ${settings.invoice.bankDetails}
              </p>
            ` : ''}

            ${settings.invoice.terms ? `
              <h5>Terms & Conditions</h5>
              <p style="white-space: pre-line; margin: 0;">
                ${settings.invoice.terms}
              </p>
            ` : ''}
          </div>

          <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end;">
            ${settings.invoice.showSignatureLine ? `
              <div class="sig-line-a4">
                Guest / Client Signature & Date
              </div>
            ` : ''}
            ${settings.invoice.footerNote ? `
              <div style="font-size: 11px; color: #64748b; text-align: right; margin-top: 14px;">
                ${settings.invoice.footerNote}
              </div>
            ` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
}

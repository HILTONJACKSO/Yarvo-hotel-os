import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { syncOfflineMutations } from '@/lib/sync';
import {
  ReceiptInvoiceSettings,
  getDefaultReceiptInvoiceSettings,
  generateThermalReceiptHtml,
  generateA4InvoiceHtml
} from '@/lib/receipt-invoice-helper';

export default function ReceiptsSettings({ showToast }: { showToast: (msg: string, type?: 'success' | 'error', title?: string) => void }) {
  const [property, setProperty] = useState<any>(null);
  const [settings, setSettings] = useState<ReceiptInvoiceSettings>(getDefaultReceiptInvoiceSettings());
  const [activeTab, setActiveTab] = useState<'branding' | 'receipt' | 'invoice'>('branding');
  const [previewMode, setPreviewMode] = useState<'receipt' | 'invoice'>('receipt');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProperty();
  }, []);

  const fetchProperty = async () => {
    try {
      const cached = await db.properties.toArray();
      if (cached && cached.length > 0) {
        setProperty(cached[0]);
        setSettings(getDefaultReceiptInvoiceSettings(cached[0]));
      }

      const res = await fetch('/api/v1/properties', { credentials: 'include' });
      if (res.ok) {
        const resData = await res.json();
        const data = Array.isArray(resData) ? resData[0] : (resData.data || resData);
        if (data && data.id) {
          setProperty(data);
          setSettings(getDefaultReceiptInvoiceSettings(data));
          db.properties.put(data);
        }
      }
    } catch (err) {
      console.error('Failed to load property receipt settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGeneral = (field: keyof ReceiptInvoiceSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateReceipt = (field: keyof ReceiptInvoiceSettings['receipt'], value: any) => {
    setSettings(prev => ({
      ...prev,
      receipt: {
        ...prev.receipt,
        [field]: value
      }
    }));
  };

  const handleUpdateInvoice = (field: keyof ReceiptInvoiceSettings['invoice'], value: any) => {
    setSettings(prev => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        [field]: value
      }
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingLogo(true);
    showToast('Uploading custom logo...', 'success', 'Logo');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        handleUpdateGeneral('logoUrl', data.url);
        handleUpdateGeneral('showLogo', true);
        showToast('Logo uploaded successfully', 'success', 'Success');
      } else {
        throw new Error(data.error || 'Failed to upload image');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error uploading logo', 'error', 'Error');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetToDefaults = () => {
    if (!confirm('Reset all receipt and invoice templates back to property default info?')) return;
    const defaults = getDefaultReceiptInvoiceSettings(property);
    setSettings(defaults);
    showToast('Template fields reset to property defaults.', 'success', 'Reset');
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!property?.id) {
      showToast('No active property identified to save settings.', 'error', 'Error');
      return;
    }

    setSaving(true);
    try {
      const updatedProp = {
        ...property,
        receiptSettings: settings,
      };

      await db.properties.put(updatedProp);

      await db.syncQueue.add({
        url: `/api/v1/properties/${property.id}`,
        method: 'PATCH',
        payload: { receiptSettings: settings },
        createdAt: Date.now(),
        status: 'PENDING',
        retryCount: 0
      });

      if (navigator.onLine) {
        const res = await fetch(`/api/v1/properties/${property.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptSettings: settings }),
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Server returned error while saving receipt settings');
        }
        syncOfflineMutations();
      }

      showToast('Receipt & Invoice settings saved successfully!', 'success', 'Saved');
    } catch (err: any) {
      console.error('Error saving receipt settings:', err);
      showToast('Saved offline. Will sync with server when online.', 'success', 'Saved Offline');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    if (previewMode === 'receipt') {
      const receiptHtml = generateThermalReceiptHtml({
        settings,
        orderId: 'DEMO-7890',
        orderDate: new Date().toLocaleString(),
        destinationLabel: 'Table 4 / Poolside',
        serverName: 'Sarah Jenkins',
        items: [
          { name: 'Grilled Red Snapper', quantity: 2, price: '$22.00', total: '$44.00' },
          { name: 'Tropical Coconut Punch', quantity: 2, price: '$6.50', total: '$13.00' },
          { name: 'Cassava Fries & Dip', quantity: 1, price: '$7.00', total: '$7.00' },
        ],
        subtotal: '$64.00',
        tax: '$6.40',
        taxLabel: 'GST / VAT (10%)',
        total: '$70.40',
        isInvoiceMode: false,
      });
      doc.write(receiptHtml);
    } else {
      const invoiceHtml = generateA4InvoiceHtml({
        settings,
        invoiceNumber: '8829',
        invoiceDate: new Date().toLocaleDateString(),
        dueDate: new Date(Date.now() + 86400000 * 7).toLocaleDateString(),
        guestName: 'Ambassador Alexander Vance',
        guestEmail: 'a.vance@diplomacy.org',
        guestPhone: '+231 777 555 432',
        guestAddress: 'Sinkor, 12th Street, Monrovia',
        roomNumber: 'Deluxe Ocean Villa #104',
        checkInDate: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
        checkOutDate: new Date().toLocaleDateString(),
        items: [
          { date: 'Oct 13, 2026', description: 'Deluxe Ocean Villa (Night 1)', category: 'Lodging', amount: '$180.00' },
          { date: 'Oct 14, 2026', description: 'Deluxe Ocean Villa (Night 2)', category: 'Lodging', amount: '$180.00' },
          { date: 'Oct 14, 2026', description: 'Beachside Seafood Dinner (POS Order #554)', category: 'Restaurant', amount: '$74.50' },
          { date: 'Oct 15, 2026', description: 'Airport Luxury Transfer Shuttle', category: 'Transport', amount: '$45.00' },
        ],
        subtotal: '$479.50',
        tax: '$47.95',
        total: '$527.45',
        totalPaid: '$200.00',
        balanceDue: '$327.45',
      });
      doc.write(invoiceHtml);
    }

    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1500);
    }, 300);
  };

  if (loading) {
    return <div style={{ color: 'hsl(215, 20%, 65%)', padding: '24px' }}>Loading Receipt & Invoice configuration...</div>;
  }

  return (
    <div className="receipts-customizer">
      {/* Top Banner and Actions */}
      <div className="customizer-header">
        <div>
          <h3 style={{ margin: 0, color: 'hsl(210, 40%, 96%)', fontSize: '1.25rem' }}>Receipt & Invoice Customization</h3>
          <p style={{ margin: '4px 0 0 0', color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem' }}>
            Brand your customer documents with custom logos, header notes, terms & conditions, and bank details for global multi-property operations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={handleResetToDefaults}>
            Reset to Defaults
          </button>
          <button type="button" className="btn-primary" onClick={() => handleSave()} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      <div className="customizer-grid">
        {/* Left Form Column */}
        <div className="panel customizer-left">
          {/* Sub Navigation Tabs */}
          <div className="subtabs">
            <button
              type="button"
              className={`subtab-btn ${activeTab === 'branding' ? 'active' : ''}`}
              onClick={() => setActiveTab('branding')}
            >
              🏷️ General Branding
            </button>
            <button
              type="button"
              className={`subtab-btn ${activeTab === 'receipt' ? 'active' : ''}`}
              onClick={() => { setActiveTab('receipt'); setPreviewMode('receipt'); }}
            >
              🧾 Thermal Receipt
            </button>
            <button
              type="button"
              className={`subtab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
              onClick={() => { setActiveTab('invoice'); setPreviewMode('invoice'); }}
            >
              📄 Guest Invoice (A4)
            </button>
          </div>

          <form onSubmit={handleSave}>
            {/* TAB 1: General Branding */}
            {activeTab === 'branding' && (
              <div className="form-section">
                <h4 className="section-title">Property Branding & Contact Info</h4>
                <p className="section-desc">These details appear at the top of all printed receipts and invoices.</p>

                {/* Logo Uploader */}
                <div className="form-group full" style={{ marginBottom: '18px' }}>
                  <label>Business Logo</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="logo-preview-box">
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ color: 'hsl(215, 20%, 50%)', fontSize: '0.8rem' }}>No Logo</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleLogoUpload}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
                      </button>
                      {settings.logoUrl && (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ borderColor: 'hsl(0, 60%, 30%)', color: 'hsl(0, 70%, 70%)', padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleUpdateGeneral('logoUrl', '')}
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>

                  <label className="checkbox-label" style={{ marginTop: '10px' }}>
                    <input
                      type="checkbox"
                      checked={settings.showLogo}
                      onChange={e => handleUpdateGeneral('showLogo', e.target.checked)}
                    />
                    <span>Show logo on receipts and invoices</span>
                  </label>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Business / Trading Name</label>
                    <input
                      className="form-input"
                      value={settings.businessName}
                      onChange={e => handleUpdateGeneral('businessName', e.target.value)}
                      placeholder="e.g. Kwalee Beach Resort"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tagline / Slogan</label>
                    <input
                      className="form-input"
                      value={settings.tagline}
                      onChange={e => handleUpdateGeneral('tagline', e.target.value)}
                      placeholder="e.g. Luxury Coastal Escape & Beach Resort"
                    />
                  </div>

                  <div className="form-group full">
                    <label>Physical Address</label>
                    <input
                      className="form-input"
                      value={settings.address}
                      onChange={e => handleUpdateGeneral('address', e.target.value)}
                      placeholder="e.g. Marshall, Robertsfield Highway"
                    />
                  </div>

                  <div className="form-group">
                    <label>City</label>
                    <input
                      className="form-input"
                      value={settings.city}
                      onChange={e => handleUpdateGeneral('city', e.target.value)}
                      placeholder="e.g. Marshall / Monrovia"
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      className="form-input"
                      value={settings.country}
                      onChange={e => handleUpdateGeneral('country', e.target.value)}
                      placeholder="e.g. Liberia"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number(s)</label>
                    <input
                      className="form-input"
                      value={settings.phone}
                      onChange={e => handleUpdateGeneral('phone', e.target.value)}
                      placeholder="e.g. +231 881 744 350"
                    />
                  </div>
                  <div className="form-group">
                    <label>Official Email</label>
                    <input
                      className="form-input"
                      value={settings.email}
                      onChange={e => handleUpdateGeneral('email', e.target.value)}
                      placeholder="e.g. kwaleebeachresort1@gmail.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Website URL</label>
                    <input
                      className="form-input"
                      value={settings.website}
                      onChange={e => handleUpdateGeneral('website', e.target.value)}
                      placeholder="e.g. https://kwaleebeachresort.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tax ID / TIN / VAT Registration</label>
                    <input
                      className="form-input"
                      value={settings.taxNumber}
                      onChange={e => handleUpdateGeneral('taxNumber', e.target.value)}
                      placeholder="e.g. LBR-TIN-98765432"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Thermal Receipt Settings */}
            {activeTab === 'receipt' && (
              <div className="form-section">
                <h4 className="section-title">POS Thermal Receipt Settings</h4>
                <p className="section-desc">Optimized for standard 80mm and 58mm thermal receipt printers at POS checkout and restaurant/bars.</p>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Receipt Header Title</label>
                    <input
                      className="form-input"
                      value={settings.receipt.title}
                      onChange={e => handleUpdateReceipt('title', e.target.value)}
                      placeholder="CUSTOMER RECEIPT"
                    />
                  </div>
                  <div className="form-group">
                    <label>Receipt Prefix</label>
                    <input
                      className="form-input"
                      value={settings.receipt.prefix}
                      onChange={e => handleUpdateReceipt('prefix', e.target.value)}
                      placeholder="REC-"
                    />
                  </div>

                  <div className="form-group full">
                    <label>Thermal Paper Width</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        className={`paper-btn ${settings.receipt.paperWidth === '80mm' ? 'active' : ''}`}
                        onClick={() => handleUpdateReceipt('paperWidth', '80mm')}
                      >
                        <strong>80mm</strong> (Standard POS Thermal)
                      </button>
                      <button
                        type="button"
                        className={`paper-btn ${settings.receipt.paperWidth === '58mm' ? 'active' : ''}`}
                        onClick={() => handleUpdateReceipt('paperWidth', '58mm')}
                      >
                        <strong>58mm</strong> (Compact Mobile Thermal)
                      </button>
                    </div>
                  </div>

                  <div className="form-group full">
                    <label>Header Note / Welcome Greeting</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={settings.receipt.headerNote}
                      onChange={e => handleUpdateReceipt('headerNote', e.target.value)}
                      placeholder="e.g. Thank you for visiting us today!"
                    />
                  </div>

                  <div className="form-group full">
                    <label>Footer Note / Parting Message</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={settings.receipt.footerNote}
                      onChange={e => handleUpdateReceipt('footerNote', e.target.value)}
                      placeholder="e.g. We appreciate your business! Please come again."
                    />
                  </div>

                  <div className="form-group full">
                    <label>Terms & Conditions (Bottom of Receipt)</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={settings.receipt.terms}
                      onChange={e => handleUpdateReceipt('terms', e.target.value)}
                      placeholder="e.g. Goods sold are not returnable after 24 hours. Retain this receipt for any claims."
                    />
                  </div>

                  <div className="form-group full toggles-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.receipt.showTaxBreakdown}
                        onChange={e => handleUpdateReceipt('showTaxBreakdown', e.target.checked)}
                      />
                      <span>Show Tax / VAT Breakdown line</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.receipt.showServerName}
                        onChange={e => handleUpdateReceipt('showServerName', e.target.checked)}
                      />
                      <span>Show Server / Cashier Name</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.receipt.showTableNumber}
                        onChange={e => handleUpdateReceipt('showTableNumber', e.target.checked)}
                      />
                      <span>Show Table / Room Destination</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Guest Folio Invoice Settings */}
            {activeTab === 'invoice' && (
              <div className="form-section">
                <h4 className="section-title">Guest Folio & Formal Invoice Settings</h4>
                <p className="section-desc">Designed for A4/Letterhead format guest folios, corporate billing, and checkout invoices.</p>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Invoice Header Title</label>
                    <input
                      className="form-input"
                      value={settings.invoice.title}
                      onChange={e => handleUpdateInvoice('title', e.target.value)}
                      placeholder="GUEST FOLIO INVOICE"
                    />
                  </div>
                  <div className="form-group">
                    <label>Invoice Prefix</label>
                    <input
                      className="form-input"
                      value={settings.invoice.prefix}
                      onChange={e => handleUpdateInvoice('prefix', e.target.value)}
                      placeholder="INV-"
                    />
                  </div>

                  <div className="form-group full">
                    <label>Statement Header Note</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={settings.invoice.headerNote}
                      onChange={e => handleUpdateInvoice('headerNote', e.target.value)}
                      placeholder="e.g. Official Statement of Account"
                    />
                  </div>

                  <div className="form-group full">
                    <label>Bank Wire & Payment Instructions</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={settings.invoice.bankDetails}
                      onChange={e => handleUpdateInvoice('bankDetails', e.target.value)}
                      placeholder="e.g. Bank: Ecobank Liberia | Account No: 00123456789 | SWIFT: ECOBLR | Mobile Money: 0777123456"
                    />
                  </div>

                  <div className="form-group full">
                    <label>Invoice Terms & Conditions</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={settings.invoice.terms}
                      onChange={e => handleUpdateInvoice('terms', e.target.value)}
                      placeholder="e.g. Payment is due upon receipt. Late payments are subject to a 2% monthly service fee."
                    />
                  </div>

                  <div className="form-group full">
                    <label>Invoice Footer Note</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={settings.invoice.footerNote}
                      onChange={e => handleUpdateInvoice('footerNote', e.target.value)}
                      placeholder="e.g. Thank you for staying with us. We hope you enjoyed your stay!"
                    />
                  </div>

                  <div className="form-group full toggles-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.invoice.showSignatureLine}
                        onChange={e => handleUpdateInvoice('showSignatureLine', e.target.checked)}
                      />
                      <span>Show Customer Signature & Date Line</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.invoice.showPaymentInstructions}
                        onChange={e => handleUpdateInvoice('showPaymentInstructions', e.target.checked)}
                      />
                      <span>Include Bank Wire / Mobile Money Details Block</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.invoice.showDueDate}
                        onChange={e => handleUpdateInvoice('showDueDate', e.target.checked)}
                      />
                      <span>Show Payment Due Date</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving Changes...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Live Preview Column */}
        <div className="panel customizer-right">
          <div className="preview-top-bar">
            <div className="preview-selector">
              <button
                type="button"
                className={`preview-pill ${previewMode === 'receipt' ? 'active' : ''}`}
                onClick={() => setPreviewMode('receipt')}
              >
                🧾 Receipt (Thermal)
              </button>
              <button
                type="button"
                className={`preview-pill ${previewMode === 'invoice' ? 'active' : ''}`}
                onClick={() => setPreviewMode('invoice')}
              >
                📄 Invoice (A4)
              </button>
            </div>

            <button type="button" className="btn-print-preview" onClick={handleTestPrint}>
              🖨️ Test Print
            </button>
          </div>

          <div className="preview-viewport-container">
            {previewMode === 'receipt' ? (
              <div className={`thermal-paper-card ${settings.receipt.paperWidth === '58mm' ? 'width-58' : 'width-80'}`}>
                <div className="thermal-paper-tear top"></div>

                <div className="preview-receipt-content">
                  {settings.showLogo && settings.logoUrl && (
                    <img src={settings.logoUrl} alt="Logo" className="preview-logo-receipt" />
                  )}

                  <div className="preview-biz-name">{settings.businessName}</div>
                  {settings.tagline && <div className="preview-tagline">{settings.tagline}</div>}
                  {settings.address && <div className="preview-contact">{settings.address}</div>}
                  {settings.phone && <div className="preview-contact">Tel: {settings.phone}</div>}
                  {settings.email && <div className="preview-contact">{settings.email}</div>}
                  {settings.taxNumber && <div className="preview-contact"><strong>TIN: {settings.taxNumber}</strong></div>}

                  <div className="receipt-dash"></div>
                  <div className="preview-doc-title">{settings.receipt.title}</div>

                  <div className="receipt-meta-row">
                    <span>RECEIPT NO:</span>
                    <strong>#{settings.receipt.prefix}DEMO-7890</strong>
                  </div>
                  <div className="receipt-meta-row">
                    <span>DATE:</span>
                    <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {settings.receipt.showTableNumber && (
                    <div className="receipt-meta-row">
                      <span>DESTINATION:</span>
                      <strong>Table 4 (Poolside)</strong>
                    </div>
                  )}
                  {settings.receipt.showServerName && (
                    <div className="receipt-meta-row">
                      <span>SERVED BY:</span>
                      <span>Sarah Jenkins</span>
                    </div>
                  )}

                  <div className="receipt-dash"></div>

                  <div className="receipt-item-row">
                    <div style={{ flex: 1 }}><strong>2x</strong> Grilled Red Snapper</div>
                    <div>$44.00</div>
                  </div>
                  <div className="receipt-item-row">
                    <div style={{ flex: 1 }}><strong>2x</strong> Tropical Coconut Punch</div>
                    <div>$13.00</div>
                  </div>
                  <div className="receipt-item-row">
                    <div style={{ flex: 1 }}><strong>1x</strong> Cassava Fries & Dip</div>
                    <div>$7.00</div>
                  </div>

                  <div className="receipt-dash"></div>

                  <div className="receipt-item-row">
                    <span>Subtotal:</span>
                    <span>$64.00</span>
                  </div>
                  {settings.receipt.showTaxBreakdown && (
                    <div className="receipt-item-row" style={{ fontSize: '11px', color: '#555' }}>
                      <span>GST / VAT (10% Included):</span>
                      <span>$6.40</span>
                    </div>
                  )}
                  <div className="receipt-total-row">
                    <span>TOTAL:</span>
                    <span>$70.40</span>
                  </div>

                  {settings.receipt.footerNote && (
                    <div className="preview-footer-note">
                      {settings.receipt.footerNote}
                    </div>
                  )}

                  {settings.receipt.terms && (
                    <div className="preview-terms-box">
                      <strong>TERMS & CONDITIONS:</strong><br />
                      {settings.receipt.terms}
                    </div>
                  )}
                </div>

                <div className="thermal-paper-tear bottom"></div>
              </div>
            ) : (
              <div className="a4-invoice-card">
                <div className="a4-header">
                  <div>
                    {settings.showLogo && settings.logoUrl && (
                      <img src={settings.logoUrl} alt="Logo" className="preview-logo-a4" />
                    )}
                    <div className="a4-biz-title">{settings.businessName}</div>
                    {settings.tagline && <div className="a4-tagline">{settings.tagline}</div>}
                    <div className="a4-contact">{settings.address}</div>
                    <div className="a4-contact">Phone: {settings.phone} &bull; Email: {settings.email}</div>
                    {settings.taxNumber && <div className="a4-contact"><strong>Tax ID / TIN:</strong> {settings.taxNumber}</div>}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="a4-doc-heading">{settings.invoice.title}</div>
                    <div className="a4-badge">#{settings.invoice.prefix}8829</div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                      Date: <strong style={{ color: '#0f172a' }}>{new Date().toLocaleDateString()}</strong>
                    </div>
                    {settings.invoice.showDueDate && (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Due: <strong style={{ color: '#0f172a' }}>{new Date(Date.now() + 86400000 * 7).toLocaleDateString()}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="a4-meta-grid">
                  <div className="a4-meta-col">
                    <div className="a4-meta-label">Billed To (Guest)</div>
                    <div className="a4-guest-name">Ambassador Alexander Vance</div>
                    <div className="a4-guest-sub">a.vance@diplomacy.org &bull; +231 777 555 432</div>
                    <div className="a4-guest-sub">Sinkor, 12th Street, Monrovia</div>
                  </div>
                  <div className="a4-meta-col">
                    <div className="a4-meta-label">Booking Details</div>
                    <div className="a4-guest-sub"><strong>Room:</strong> Deluxe Ocean Villa #104</div>
                    <div className="a4-guest-sub"><strong>Stay:</strong> Oct 13, 2026 – Oct 15, 2026</div>
                    <div className="a4-guest-sub"><strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Confirmed</span></div>
                  </div>
                </div>

                <table className="a4-table">
                  <thead>
                    <tr>
                      <th style={{ width: '90px' }}>Date</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right', width: '100px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Oct 13</td>
                      <td>Deluxe Ocean Villa (Night 1)</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>$180.00</td>
                    </tr>
                    <tr>
                      <td>Oct 14</td>
                      <td>Deluxe Ocean Villa (Night 2)</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>$180.00</td>
                    </tr>
                    <tr>
                      <td>Oct 14</td>
                      <td>Beachside Seafood Dinner (POS #554)</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>$74.50</td>
                    </tr>
                    <tr>
                      <td>Oct 15</td>
                      <td>Airport Luxury Transfer Shuttle</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>$45.00</td>
                    </tr>
                  </tbody>
                </table>

                <div className="a4-totals-block">
                  <div className="a4-totals-row">
                    <span>Subtotal:</span>
                    <span>$479.50</span>
                  </div>
                  <div className="a4-totals-row">
                    <span>Taxes & Fees:</span>
                    <span>$47.95</span>
                  </div>
                  <div className="a4-totals-row grand">
                    <span>Total Charges:</span>
                    <span>$527.45</span>
                  </div>
                  <div className="a4-totals-row">
                    <span>Total Payments:</span>
                    <span style={{ color: '#16a34a' }}>-$200.00</span>
                  </div>
                  <div className="a4-totals-row balance">
                    <span>Balance Due:</span>
                    <span style={{ color: '#b91c1c' }}>$327.45</span>
                  </div>
                </div>

                <div className="a4-footer-grid">
                  <div>
                    {settings.invoice.showPaymentInstructions && settings.invoice.bankDetails && (
                      <div className="a4-info-box">
                        <strong>PAYMENT INSTRUCTIONS / WIRE:</strong><br />
                        {settings.invoice.bankDetails}
                      </div>
                    )}

                    {settings.invoice.terms && (
                      <div className="a4-terms-text">
                        <strong>TERMS:</strong> {settings.invoice.terms}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    {settings.invoice.showSignatureLine && (
                      <div className="a4-signature-line">
                        Guest / Client Signature & Date
                      </div>
                    )}
                    {settings.invoice.footerNote && (
                      <div className="a4-footer-msg">
                        {settings.invoice.footerNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .receipts-customizer { display: flex; flex-direction: column; gap: 20px; }
        .customizer-header { display: flex; justify-content: space-between; align-items: center; background: hsl(222, 35%, 10%); border: 1px solid hsl(217, 20%, 18%); border-radius: 12px; padding: 18px 24px; }
        .customizer-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 24px; align-items: start; }
        
        .customizer-left { padding: 24px; }
        .subtabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid hsl(217, 20%, 18%); padding-bottom: 12px; }
        .subtab-btn { background: transparent; border: none; color: hsl(215, 20%, 65%); padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s; }
        .subtab-btn:hover { color: white; background: hsl(222, 35%, 14%); }
        .subtab-btn.active { background: hsl(210, 100%, 50%); color: white; font-weight: 600; }
        
        .section-title { margin: 0 0 4px 0; color: hsl(210, 40%, 96%); font-size: 1.05rem; }
        .section-desc { margin: 0 0 20px 0; color: hsl(215, 20%, 60%); font-size: 0.85rem; }

        .logo-preview-box {
          background: hsl(222, 35%, 12%);
          padding: 8px;
          border-radius: 8px;
          border: 1px solid hsl(217, 20%, 22%);
          height: 64px;
          width: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .paper-btn {
          flex: 1;
          padding: 10px 14px;
          background: hsl(222, 35%, 12%);
          border: 1px solid hsl(217, 20%, 20%);
          border-radius: 6px;
          color: hsl(215, 20%, 75%);
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
          text-align: left;
        }
        .paper-btn.active {
          border-color: hsl(210, 100%, 50%);
          background: hsl(210, 100%, 50%, 0.12);
          color: white;
        }

        .toggles-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: hsl(222, 35%, 12%);
          padding: 14px 16px;
          border-radius: 8px;
          border: 1px solid hsl(217, 20%, 18%);
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          color: hsl(210, 40%, 90%);
          font-size: 0.875rem;
          cursor: pointer;
        }

        /* Right Preview Styles */
        .customizer-right { padding: 20px; position: sticky; top: 20px; }
        .preview-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid hsl(217, 20%, 18%); padding-bottom: 12px; }
        .preview-selector { display: flex; gap: 6px; background: hsl(222, 35%, 12%); padding: 3px; border-radius: 6px; }
        .preview-pill { background: transparent; border: none; color: hsl(215, 20%, 65%); padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; font-weight: 500; }
        .preview-pill.active { background: hsl(217, 20%, 22%); color: white; }
        .btn-print-preview { background: hsl(142, 60%, 20%); border: 1px solid hsl(142, 60%, 30%); color: hsl(142, 70%, 75%); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.825rem; font-weight: 600; }
        .btn-print-preview:hover { background: hsl(142, 60%, 25%); color: white; }

        .preview-viewport-container {
          background: hsl(222, 35%, 7%);
          border: 1px solid hsl(217, 20%, 15%);
          border-radius: 8px;
          padding: 24px 16px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          max-height: 720px;
          overflow-y: auto;
        }

        /* Realistic Thermal Paper styling */
        .thermal-paper-card {
          background: #ffffff;
          color: #000000;
          font-family: 'Courier New', Courier, monospace;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          position: relative;
          padding: 16px 14px;
        }
        .thermal-paper-card.width-80 { width: 320px; }
        .thermal-paper-card.width-58 { width: 250px; }

        .preview-receipt-content { text-align: left; font-size: 11px; line-height: 1.35; color: #000; }
        .preview-logo-receipt { max-width: 90px; max-height: 50px; object-fit: contain; margin: 0 auto 6px auto; display: block; }
        .preview-biz-name { font-size: 15px; font-weight: 800; text-align: center; text-transform: uppercase; margin-bottom: 2px; }
        .preview-tagline { font-size: 9px; text-align: center; font-style: italic; color: #444; margin-bottom: 4px; }
        .preview-contact { font-size: 10px; text-align: center; color: #333; }
        .receipt-dash { border-bottom: 1px dashed #000; margin: 8px 0; opacity: 0.7; }
        .preview-doc-title { text-align: center; font-weight: 800; font-size: 12px; margin: 4px 0; letter-spacing: 0.5px; }
        .receipt-meta-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; color: #222; }
        .receipt-item-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
        .receipt-total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; border-top: 1px solid #000; padding-top: 5px; margin-top: 6px; }
        .preview-footer-note { text-align: center; font-size: 10px; margin-top: 14px; color: #333; line-height: 1.3; }
        .preview-terms-box { font-size: 8px; color: #555; text-align: center; margin-top: 10px; border-top: 1px dashed #999; padding-top: 6px; }

        /* Realistic A4 Mini Card */
        .a4-invoice-card {
          background: #ffffff;
          color: #0f172a;
          width: 100%;
          max-width: 440px;
          padding: 24px 20px;
          border-radius: 4px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
        }
        .a4-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 14px; }
        .preview-logo-a4 { max-width: 100px; max-height: 45px; object-fit: contain; margin-bottom: 6px; }
        .a4-biz-title { font-size: 14px; font-weight: 800; color: #0f172a; }
        .a4-tagline { font-size: 9px; color: #64748b; font-style: italic; }
        .a4-contact { font-size: 9px; color: #334155; margin-top: 1px; }
        .a4-doc-heading { font-size: 16px; font-weight: 900; color: #0f172a; }
        .a4-badge { display: inline-block; background: #0f172a; color: white; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 700; margin-top: 2px; }

        .a4-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 10px; margin-bottom: 14px; }
        .a4-meta-label { font-size: 8px; text-transform: uppercase; color: #64748b; font-weight: 700; }
        .a4-guest-name { font-size: 11px; font-weight: 700; color: #0f172a; }
        .a4-guest-sub { font-size: 9px; color: #334155; margin-top: 1px; }

        .a4-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .a4-table th { background: #0f172a; color: white; padding: 5px 8px; text-align: left; font-size: 9px; }
        .a4-table td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 9.5px; }

        .a4-totals-block { margin-left: auto; width: 180px; margin-bottom: 14px; }
        .a4-totals-row { display: flex; justify-content: space-between; font-size: 9.5px; margin-bottom: 3px; color: #334155; }
        .a4-totals-row.grand { border-top: 1px solid #0f172a; padding-top: 3px; font-weight: 800; color: #0f172a; font-size: 10.5px; }
        .a4-totals-row.balance { border-top: 1px solid #cbd5e1; padding-top: 3px; font-weight: 800; font-size: 11px; }

        .a4-footer-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .a4-info-box { font-size: 8px; color: #475569; background: #f8fafc; padding: 6px; border-radius: 4px; border: 1px solid #e2e8f0; line-height: 1.3; margin-bottom: 6px; }
        .a4-terms-text { font-size: 7.5px; color: #64748b; line-height: 1.3; }
        .a4-signature-line { border-top: 1px solid #0f172a; width: 120px; margin-left: auto; padding-top: 3px; font-size: 8px; color: #334155; text-align: center; }
        .a4-footer-msg { font-size: 8px; color: #64748b; margin-top: 8px; }

        @media (max-width: 1024px) {
          .customizer-grid { grid-template-columns: 1fr; }
          .customizer-right { position: static; }
        }
      `}</style>
    </div>
  );
}

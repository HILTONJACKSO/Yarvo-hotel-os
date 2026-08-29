'use client';

import { useState, useEffect, use } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type FolioLineItem = {
  id: string;
  type: 'CHARGE' | 'PAYMENT' | 'ADJUSTMENT';
  category: string;
  amount: string | number;
  description: string;
  createdAt: string;
};

type Folio = {
  id: string;
  balance: number;
  status: string;
  reservation: {
    confirmationCode: string;
    checkInDate: string;
    checkOutDate: string;
    guest: { firstName: string; lastName: string; email?: string; phone?: string; address?: string };
    room: { number: string } | null;
  };
  lineItems: FolioLineItem[];
};

type ReceiptConfig = {
  header?: string;
  footer?: string;
  terms?: string;
  logoUrl?: string;
  taxNumber?: string;
};

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [folio, setFolio] = useState<Folio | null>(null);
  const [config, setConfig] = useState<ReceiptConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch property for settings
        const propRes = await fetch(`${API_URL}/api/v1/properties`);
        if (propRes.ok) {
          const propData = await propRes.json();
          if (propData && propData.length > 0) {
            const property = propData[0];
            const receiptData = typeof property.receiptSettings === 'string' 
                ? JSON.parse(property.receiptSettings) 
                : property.receiptSettings || {};
            setConfig(receiptData['invoice'] || {});
          }
        }

        // Fetch folio statement
        const folioRes = await fetch(`${API_URL}/api/v1/folios/${resolvedParams.id}/statement`);
        if (folioRes.ok) {
          const folioData = await folioRes.json();
          setFolio(folioData.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Invoice...</div>;
  if (!folio) return <div style={{ padding: '40px', textAlign: 'center' }}>Folio not found.</div>;

  const totalCharges = folio.lineItems.filter(i => i.type === 'CHARGE').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPayments = folio.lineItems.filter(i => i.type === 'PAYMENT').reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="invoice-container">
      <div className="no-print print-actions">
        <button onClick={() => window.print()} className="btn-print">Print Invoice</button>
      </div>

      <div className="invoice-paper">
        {/* Header */}
        <div className="invoice-header">
          <div className="invoice-logo-container">
            {config?.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="invoice-logo" />
            ) : (
              <h1 className="invoice-brand">Yarvo HMS</h1>
            )}
          </div>
          <div className="invoice-hotel-info">
            {config?.header ? (
              <pre className="hotel-header-text">{config.header}</pre>
            ) : (
              <>
                <h2>Yarvo Hotel & Suites</h2>
                <p>123 Ocean Drive, Monrovia, Liberia</p>
              </>
            )}
            {config?.taxNumber && <p className="tax-number">TIN: {config.taxNumber}</p>}
          </div>
        </div>

        <hr className="divider" />

        {/* Guest & Invoice Info */}
        <div className="invoice-meta">
          <div className="meta-left">
            <h3>Billed To:</h3>
            <p className="guest-name">{folio.reservation.guest.firstName} {folio.reservation.guest.lastName}</p>
            {folio.reservation.guest.email && <p>{folio.reservation.guest.email}</p>}
            {folio.reservation.guest.phone && <p>{folio.reservation.guest.phone}</p>}
          </div>
          <div className="meta-right">
            <h3>Invoice Details:</h3>
            <table className="meta-table">
              <tbody>
                <tr><td>Invoice No:</td><td>INV-{folio.id.split('-')[0].toUpperCase()}</td></tr>
                <tr><td>Date:</td><td>{new Date().toLocaleDateString()}</td></tr>
                <tr><td>Room:</td><td>{folio.reservation.room?.number || 'N/A'}</td></tr>
                <tr><td>Check-In:</td><td>{new Date(folio.reservation.checkInDate).toLocaleDateString()}</td></tr>
                <tr><td>Check-Out:</td><td>{new Date(folio.reservation.checkOutDate).toLocaleDateString()}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Line Items */}
        <div className="invoice-body">
          <table className="items-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="amount-col">Charges</th>
                <th className="amount-col">Credits</th>
              </tr>
            </thead>
            <tbody>
              {folio.lineItems.map(item => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>{item.description}</td>
                  <td className="amount-col">{item.type === 'CHARGE' ? `$${Number(item.amount).toFixed(2)}` : ''}</td>
                  <td className="amount-col">{item.type === 'PAYMENT' ? `$${Number(item.amount).toFixed(2)}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="invoice-summary">
          <table className="summary-table">
            <tbody>
              <tr>
                <td>Total Charges:</td>
                <td>${totalCharges.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Total Payments:</td>
                <td>${totalPayments.toFixed(2)}</td>
              </tr>
              <tr className="balance-row">
                <td>Balance Due:</td>
                <td>${Number(folio.balance).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer & Terms */}
        <div className="invoice-footer">
          {config?.terms && (
            <div className="terms-section">
              <h4>Terms & Conditions</h4>
              <pre className="terms-text">{config.terms}</pre>
            </div>
          )}
          
          <div className="footer-section">
            {config?.footer ? (
              <pre className="footer-text">{config.footer}</pre>
            ) : (
              <p>Thank you for choosing Yarvo Hotel!</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        body { background: #f1f5f9; margin: 0; color: #1e293b; font-family: 'Inter', sans-serif; }
        .invoice-container { padding: 40px; display: flex; flex-direction: column; align-items: center; }
        .invoice-paper { background: white; width: 100%; max-width: 800px; padding: 60px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 4px; }
        
        .print-actions { margin-bottom: 24px; }
        .btn-print { background: #0f172a; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem; }
        
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
        .invoice-logo { max-width: 200px; max-height: 80px; object-fit: contain; }
        .invoice-brand { margin: 0; font-size: 2rem; color: #0f172a; }
        .invoice-hotel-info { text-align: right; }
        .hotel-header-text { font-family: inherit; margin: 0; white-space: pre-wrap; font-size: 0.875rem; line-height: 1.5; color: #475569; }
        .invoice-hotel-info h2 { margin: 0 0 4px 0; font-size: 1.25rem; }
        .invoice-hotel-info p { margin: 0; color: #475569; font-size: 0.875rem; line-height: 1.5; }
        .tax-number { margin-top: 4px !important; font-weight: 600; }
        
        .divider { border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0; }
        
        .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .meta-left h3, .meta-right h3 { margin: 0 0 12px 0; font-size: 1rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .meta-left p { margin: 0 0 4px 0; font-size: 0.9375rem; }
        .guest-name { font-weight: 600; font-size: 1.125rem !important; color: #0f172a; }
        
        .meta-table { border-collapse: collapse; }
        .meta-table td { padding: 4px 12px 4px 0; font-size: 0.9375rem; }
        .meta-table td:first-child { color: #64748b; font-weight: 500; }
        .meta-table td:last-child { font-weight: 600; color: #0f172a; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #f8fafc; padding: 12px; text-align: left; font-size: 0.875rem; color: #475569; border-bottom: 2px solid #e2e8f0; }
        .items-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 0.9375rem; }
        .amount-col { text-align: right !important; }
        
        .invoice-summary { display: flex; justify-content: flex-end; margin-bottom: 40px; }
        .summary-table { width: 300px; border-collapse: collapse; }
        .summary-table td { padding: 8px 12px; font-size: 0.9375rem; }
        .summary-table td:last-child { text-align: right; }
        .balance-row td { border-top: 2px solid #0f172a; font-weight: 700; font-size: 1.125rem; padding-top: 12px; }
        
        .terms-section { margin-bottom: 40px; }
        .terms-section h4 { margin: 0 0 8px 0; font-size: 0.875rem; color: #64748b; text-transform: uppercase; }
        .terms-text { font-family: inherit; margin: 0; white-space: pre-wrap; font-size: 0.75rem; color: #64748b; line-height: 1.5; }
        
        .footer-section { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .footer-text { font-family: inherit; margin: 0; white-space: pre-wrap; font-size: 0.875rem; color: #475569; }
        
        @media print {
          body { background: white; }
          .invoice-container { padding: 0; }
          .invoice-paper { box-shadow: none; padding: 0; max-width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

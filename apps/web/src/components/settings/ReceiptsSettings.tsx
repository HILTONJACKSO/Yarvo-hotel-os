import { useState, useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type ReceiptConfig = {
  header?: string;
  footer?: string;
  terms?: string;
  logoUrl?: string;
  taxNumber?: string;
};

type ReceiptSettingsMap = {
  [department: string]: ReceiptConfig;
};

export default function ReceiptsSettings({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [propertyId, setPropertyId] = useState<string>('');
  const [settings, setSettings] = useState<ReceiptSettingsMap>({});
  const [activeDept, setActiveDept] = useState<string>('invoice');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const departments = [
    { id: 'invoice', name: 'Folio Invoice' },
    { id: 'restaurant', name: 'Restaurant' },
    { id: 'bar', name: 'Bar' },
    { id: 'pool', name: 'Pool' },
    { id: 'beach', name: 'Beach' },
    { id: 'events', name: 'Events' }
  ];

  useEffect(() => {
    fetchProperty();
  }, []);

  const fetchProperty = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/properties`, { credentials: 'include' });
      const resData = await res.json();
      const data = resData.data || resData; // Handle if wrapped in { data: ... }
      
      if (data && data.id) {
        setPropertyId(data.id);
        const receiptData = typeof data.receiptSettings === 'string' 
            ? JSON.parse(data.receiptSettings) 
            : data.receiptSettings || {};
        setSettings(receiptData);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to load settings', 'error');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ReceiptConfig, value: string) => {
    setSettings(prev => ({
      ...prev,
      [activeDept]: {
        ...(prev[activeDept] || {}),
        [field]: value
      }
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      showToast('Uploading logo...');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        handleChange('logoUrl', data.url);
        showToast('Logo uploaded successfully', 'success');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to upload logo', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptSettings: JSON.stringify(settings) }),
        credentials: 'include',
      });

      if (res.ok) {
        showToast('Receipt settings saved successfully!', 'success');
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving receipt settings', 'error');
    }
  };

  if (loading) return <div style={{ color: 'hsl(215, 20%, 65%)' }}>Loading settings...</div>;

  const currentConfig = settings[activeDept] || {};

  return (
    <div className="panel">
      <div className="header-actions">
        <h3>Receipt & Invoice Templates</h3>
        <select 
          className="form-input" 
          style={{ width: '250px' }}
          value={activeDept}
          onChange={(e) => setActiveDept(e.target.value)}
        >
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name} Template</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSave}>
        <div className="form-grid">
          
          <div className="form-group full">
            <label>Custom Logo (Optional)</label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {currentConfig.logoUrl ? (
                <div style={{ 
                  background: 'hsl(222, 35%, 12%)', 
                  padding: '8px', 
                  borderRadius: '6px',
                  border: '1px solid hsl(217, 20%, 18%)',
                  height: '60px',
                  width: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img src={currentConfig.logoUrl} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              ) : (
                <div style={{ 
                  background: 'hsl(222, 35%, 12%)', 
                  padding: '8px', 
                  borderRadius: '6px',
                  border: '1px dashed hsl(217, 20%, 30%)',
                  height: '60px',
                  width: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(215, 20%, 50%)',
                  fontSize: '0.8rem'
                }}>
                  No Logo
                </div>
              )}
              
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
                >
                  Upload Image
                </button>
                {currentConfig.logoUrl && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ borderColor: 'hsl(0, 60%, 30%)', color: 'hsl(0, 70%, 70%)', padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={() => handleChange('logoUrl', '')}
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'hsl(215, 20%, 50%)' }}>
              If left blank, the system logo will be used.
            </p>
          </div>

          <div className="form-group full">
            <label>Tax / Registration Number (Optional)</label>
            <input 
              className="form-input" 
              value={currentConfig.taxNumber || ''} 
              onChange={e => handleChange('taxNumber', e.target.value)}
              placeholder="e.g. LBR-TIN-12345678"
            />
          </div>

          <div className="form-group full">
            <label>Header Text (Printed at the top)</label>
            <textarea 
              className="form-input" 
              rows={3}
              value={currentConfig.header || ''} 
              onChange={e => handleChange('header', e.target.value)}
              placeholder="e.g. Yarvo Hotel & Suites\n123 Ocean Drive, Monrovia\nPhone: +231 123 456"
            />
          </div>
          
          <div className="form-group full">
            <label>Footer Text (Printed at the bottom)</label>
            <textarea 
              className="form-input" 
              rows={3}
              value={currentConfig.footer || ''} 
              onChange={e => handleChange('footer', e.target.value)}
              placeholder="e.g. Thank you for your business!"
            />
          </div>

          <div className="form-group full">
            <label>Terms & Conditions (Mainly for Invoices)</label>
            <textarea 
              className="form-input" 
              rows={4}
              value={currentConfig.terms || ''} 
              onChange={e => handleChange('terms', e.target.value)}
              placeholder="e.g. Payment is due within 30 days. Late payments subject to 5% fee."
            />
          </div>

          <div className="form-group full" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn-primary">Save {departments.find(d => d.id === activeDept)?.name} Settings</button>
          </div>
        </div>
      </form>
    </div>
  );
}

import re

with open('apps/web/src/app/dashboard/cashier/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

modal_code = '''
const TransferModal = ({ isOpen, onClose, onTransferSuccess, API_URL }: any) => {
  const { showToast } = useToast();
  const [sourceOrderId, setSourceOrderId] = useState<string>('');
  const [targetTableId, setTargetTableId] = useState<string>('');
  const [targetOrderId, setTargetOrderId] = useState<string>('');
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: number}>({});
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      fetchTables();
      setSourceOrderId('');
      setTargetTableId('');
      setTargetOrderId('');
      setSelectedItems({});
    }
  }, [isOpen]);

  const fetchOrders = () => {
    fetch(\/api/v1/pos/orders, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setActiveOrders(data.data || data || []))
      .catch(console.error);
  };

  const fetchTables = () => {
    fetch(\/api/v1/pos/tables, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTables(data.data || data || []))
      .catch(console.error);
  };

  const sourceOrder = activeOrders.find(o => o.id === sourceOrderId);

  const handleItemSelect = (itemId: string, maxQty: number, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => ({ ...prev, [itemId]: maxQty }));
    } else {
      const newItems = { ...selectedItems };
      delete newItems[itemId];
      setSelectedItems(newItems);
    }
  };

  const handleQtyChange = (itemId: string, qty: number, maxQty: number) => {
    if (qty > maxQty) qty = maxQty;
    if (qty < 1) qty = 1;
    setSelectedItems(prev => ({ ...prev, [itemId]: qty }));
  };

  const handleTransfer = async () => {
    if (!sourceOrderId) return showToast('Select a source order', 'error');
    if (!targetTableId && !targetOrderId) return showToast('Select a target table or order', 'error');
    const itemsToTransfer = Object.keys(selectedItems).map(id => ({ id, quantity: selectedItems[id] }));
    if (itemsToTransfer.length === 0) return showToast('Select at least one item to transfer', 'error');

    setIsTransferring(true);
    try {
      const res = await fetch(\/api/v1/pos/orders/transfer, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sourceOrderId,
          targetTableId: targetTableId || undefined,
          targetOrderId: targetOrderId || undefined,
          items: itemsToTransfer
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.message || 'Transfer failed');
      }

      showToast('Items transferred successfully', 'success');
      onTransferSuccess();
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Failed to transfer items', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ border: '1px solid hsl(43, 96%, 56%)' }}>
        <h3 className="text-xl font-semibold text-white mb-4" style={{ color: 'hsl(43, 96%, 56%)' }}>Transfer Items</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Source Order</label>
            <select 
              className="w-full bg-[#1e293b] border border-[#334155] text-white rounded p-2"
              value={sourceOrderId}
              onChange={(e) => {
                setSourceOrderId(e.target.value);
                setSelectedItems({});
              }}
            >
              <option value="">Select source...</option>
              {activeOrders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.table ? \Table \\ : 'Walk-in'} - {o.id.substring(0,6)} - \
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Destination</label>
            <select 
              className="w-full bg-[#1e293b] border border-[#334155] text-white rounded p-2"
              value={targetTableId || targetOrderId}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('table_')) {
                  setTargetTableId(val.replace('table_', ''));
                  setTargetOrderId('');
                } else if (val.startsWith('order_')) {
                  setTargetOrderId(val.replace('order_', ''));
                  setTargetTableId('');
                } else {
                  setTargetTableId('');
                  setTargetOrderId('');
                }
              }}
            >
              <option value="">Select destination...</option>
              <optgroup label="Tables">
                {tables.map(t => (
                  <option key={\	able_\\} value={\	able_\\}>
                    Table {t.number}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Active Walk-ins">
                {activeOrders.filter(o => !o.tableId).map(o => (
                  <option key={\order_\\} value={\order_\\}>
                    Walk-in - {o.id.substring(0,6)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {sourceOrder && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Select Items to Transfer</h4>
            <div className="bg-[#1e293b] rounded p-2">
              {sourceOrder.items.length === 0 && <div className="text-gray-500 text-sm p-2">No items in this order.</div>}
              {sourceOrder.items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-2 border-b border-[#334155] last:border-0">
                  <input 
                    type="checkbox" 
                    checked={!!selectedItems[item.id]}
                    onChange={(e) => handleItemSelect(item.id, item.quantity, e.target.checked)}
                  />
                  <div className="flex-1 text-white text-sm">{item.menuItem.name}</div>
                  <div className="text-sm text-gray-400">Total Qty: {item.quantity}</div>
                  {!!selectedItems[item.id] && (
                    <input 
                      type="number" 
                      min="1" 
                      max={item.quantity}
                      className="w-16 bg-[#0f172a] border border-[#334155] text-white rounded p-1 text-sm text-center"
                      value={selectedItems[item.id]}
                      onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 1, item.quantity)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button 
            className="px-4 py-2 bg-[#1e293b] text-white rounded hover:bg-[#334155]"
            onClick={onClose}
            disabled={isTransferring}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-[#d97706] text-white rounded hover:bg-[#b45309] font-medium"
            onClick={handleTransfer}
            disabled={isTransferring || Object.keys(selectedItems).length === 0 || (!targetTableId && !targetOrderId) || sourceOrderId === targetOrderId}
          >
            {isTransferring ? 'Transferring...' : 'Transfer Items'}
          </button>
        </div>
      </div>
    </div>
  );
};
'''

content = content.replace('export default function CashierPage() {', modal_code + '\nexport default function CashierPage() {\n  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);')

stat_card_html = '''
          <div className="stat-card">
            <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(215, 20%, 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
            <div className="stat-value"></div>
            <div className="stat-title">Total Revenue Generated</div>
            <div className="stat-desc">Payments received today</div>
          </div>
          <div className="stat-card cursor-pointer hover:border-yellow-500 transition-colors" style={{ border: '1px solid hsl(43, 96%, 56%)' }} onClick={() => setIsTransferModalOpen(true)}>
            <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(43, 96%, 56%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3v18"/><path d="m10 18 7 3 7-3"/><path d="M7 21V3"/><path d="m14 6-7-3-7 3"/></svg></div>
            <div className="stat-value" style={{ color: 'hsl(43, 96%, 56%)' }}>Transfer Items</div>
            <div className="stat-title">Between Tables/Orders</div>
            <div className="stat-desc">Move items from one table to another</div>
          </div>
'''

# Find the stat-card for totalRevenue and replace it with both
content = re.sub(
  r'<div className="stat-card">.*?Total Revenue Generated.*?</div>\s*</div>',
  stat_card_html.strip(),
  content,
  flags=re.DOTALL
)

# Insert the modal rendering
content = content.replace('<div className="coming-soon-grid" style={{ marginBottom: \'28px\' }}>', '<TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onTransferSuccess={fetchOrders} API_URL={API_URL} />\n        <div className="coming-soon-grid" style={{ marginBottom: \'28px\' }}>')

with open('apps/web/src/app/dashboard/cashier/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


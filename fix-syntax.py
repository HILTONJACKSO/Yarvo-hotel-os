import re

with open('apps/web/src/app/dashboard/cashier/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the first select
repl1 = '''
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
                  {o.table ? 'Table ' + o.table.number : 'Walk-in'} - {o.id.substring(0,6)} - \
                </option>
              ))}
            </select>
'''

content = re.sub(
    r'<select[\s\S]*?<option value="">Select source...</option>[\s\S]*?</select>',
    repl1.strip(),
    content
)

repl2 = '''
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
                  <option key={'table_' + t.id} value={'table_' + t.id}>
                    Table {t.number}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Active Walk-ins">
                {activeOrders.filter(o => !o.tableId).map(o => (
                  <option key={'order_' + o.id} value={'order_' + o.id}>
                    Walk-in - {o.id.substring(0,6)}
                  </option>
                ))}
              </optgroup>
            </select>
'''

content = re.sub(
    r'<select[\s\S]*?<optgroup label="Tables">[\s\S]*?</select>',
    repl2.strip(),
    content
)

with open('apps/web/src/app/dashboard/cashier/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


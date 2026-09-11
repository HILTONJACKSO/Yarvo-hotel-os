const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/dashboard/cashier/page.tsx', 'utf8');

const regex = /<select[\s\S]*?<optgroup label="Active Walk-ins">[\s\S]*?<\/select>/g;
const replacement = 
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
;

code = code.replace(regex, replacement.trim());
fs.writeFileSync('apps/web/src/app/dashboard/cashier/page.tsx', code);

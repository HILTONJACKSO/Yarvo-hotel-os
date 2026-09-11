const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/dashboard/inventory/page.tsx', 'utf8');

// Add Boutique to location dropdowns
code = code.replace(/<option value="HOUSEKEEPING">Housekeeping<\/option>\s*<\/select>/g, '<option value="HOUSEKEEPING">Housekeeping</option>\n                      <option value="BOUTIQUE">Boutique</option>\n                    </select>');

// Add stockBoutique to InventoryItem type
code = code.replace('stockHousekeeping: string;', 'stockHousekeeping: string;\n  stockBoutique: string;');

// Add Boutique column to the table header
code = code.replace('<th>H.Keeping</th>', '<th>H.Keeping</th>\n                <th>Boutique</th>');

// Add Boutique cell to the table rows
code = code.replace(/<td>\{Number\(item\.stockHousekeeping \|\| 0\)\.toFixed\(2\)\}<\/td>/g, '<td>{Number(item.stockHousekeeping || 0).toFixed(2)}</td>\n                  <td>{Number(item.stockBoutique || 0).toFixed(2)}</td>');

fs.writeFileSync('apps/web/src/app/dashboard/inventory/page.tsx', code);

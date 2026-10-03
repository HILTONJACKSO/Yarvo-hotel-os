path = "apps/web/src/components/rooms/AddRoomModal.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

import re

# Update schema
c = re.sub(
    r"roomTypeId: z\.string\(\)\.min\(1, 'Please select a room type'\),",
    "roomTypeId: z.string().min(1, 'Please select a room type'),\n  status: z.string().optional(),",
    c
)

# Update form elements
search_html = """            <div className="form-group">
              <label>Notes</label>
              <textarea {...register('notes')} rows={3} placeholder="Optional notes..."></textarea>
            </div>"""

replace_html = """            {initialData && (
              <div className="form-group">
                <label>Status</label>
                <select {...register('status')}>
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="DIRTY">Dirty</option>
                  <option value="CLEAN">Clean</option>
                  <option value="OUT_OF_ORDER">Out of Order</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
            )}
            
            <div className="form-group">
              <label>Notes</label>
              <textarea {...register('notes')} rows={3} placeholder="Optional notes..."></textarea>
            </div>"""

c = c.replace(search_html, replace_html)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("Patched AddRoomModal for status editing")

import sys
import re

with open('apps/web/src/components/reservations/NewReservationModal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

new_field = """
          <div className="form-group">
            <label>Assign Specific Room (Optional)</label>
            <select {...register('roomId')} className={errors.roomId ? 'error' : ''} disabled={!watch('roomTypeId')}>
              <option value="">-- Auto-assign on check-in --</option>
              {rooms.filter(r => r.roomTypeId === watch('roomTypeId')).map((r) => (
                <option key={r.id} value={r.id}>Room {r.number} - {r.status}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Only rooms matching the selected room type will be shown.
            </p>
          </div>
"""

# Find the end of the roomTypeId form-group
pattern = re.compile(r'(<select \{\.\.\.register\(\'roomTypeId\'\)\}.*?</select>\s*\{errors\.roomTypeId.*?\s*</div>)', re.DOTALL)

code = pattern.sub(r'\1' + new_field, code)

with open('apps/web/src/components/reservations/NewReservationModal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

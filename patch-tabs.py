import re

path = "apps/web/src/components/staff/AttendanceTab.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("export function AttendanceTab({ staff }: { staff: User[] }) {", 
"export function AttendanceTab({ staff, isManager, currentUser }: { staff: User[], isManager?: boolean, currentUser?: any }) {")

form_search = """        <form className="clock-in-form" onSubmit={handleClockIn}>
          <select value={clockInUserId} onChange={e => setClockInUserId(e.target.value)} required className="form-input">
            <option value="">Select Staff to Clock In</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Clock In Now</button>
        </form>"""

form_replace = """        <form className="clock-in-form" onSubmit={(e) => {
            if (!isManager && currentUser?.id) {
              e.preventDefault();
              setClockInUserId(currentUser.id);
              // We must call it right away with the correct ID
              fetch('/api/v1/staff/attendance/clock-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id })
              }).then(r => { if (r.ok) fetchAttendance(); });
            } else {
              handleClockIn(e);
            }
          }}>
            {isManager ? (
              <>
                <select value={clockInUserId} onChange={e => setClockInUserId(e.target.value)} required className="form-input">
                  <option value="">Select Staff to Clock In</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
                <button type="submit" className="btn-primary">Clock In Now</button>
              </>
            ) : (
              <button type="submit" className="btn-primary">Clock In (Me)</button>
            )}
          </form>"""

c = c.replace(form_search, form_replace)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("Updated AttendanceTab.tsx")

path_staff = "apps/web/src/app/dashboard/staff/page.tsx"
with open(path_staff, "r", encoding="utf-8") as f:
    c_staff = f.read()

c_staff = c_staff.replace("<AttendanceTab staff={staff} />", "<AttendanceTab staff={staff} isManager={isManager} currentUser={user} />")
c_staff = c_staff.replace("<PayrollTab staff={staff} />", "<PayrollTab staff={staff} isManager={isManager} />")

with open(path_staff, "w", encoding="utf-8") as f:
    f.write(c_staff)
print("Updated staff/page.tsx")


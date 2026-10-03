path = "apps/web/src/app/dashboard/events/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

import re

pattern = r"const groupedBookings = bookings\.reduce\(\(acc, booking\) => \{\s*const date = new Date\(booking\.startTime\)\.toLocaleDateString\(\);\s*if \(\!acc\[date\]\) acc\[date\] = \[\];\s*acc\[date\]\.push\(booking\);\s*return acc;\s*\}, \{\} as Record<string, EventBooking\[\]>\);"

replace = """const groupedBookings = bookings.reduce((acc, booking) => {
    // Group by standard YYYY-MM-DD to avoid timezone/locale parse errors on 'new Date(string)'
    const date = new Date(booking.startTime).getFullYear() + '-' + String(new Date(booking.startTime).getMonth() + 1).padStart(2, '0') + '-' + String(new Date(booking.startTime).getDate()).padStart(2, '0');
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, EventBooking[]>);"""

if re.search(pattern, c):
    c = re.sub(pattern, replace, c)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched groupedBookings in events page")
else:
    print("Regex failed to find groupedBookings")

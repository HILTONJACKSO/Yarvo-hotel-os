import sys
import re

with open("apps/api/src/modules/analytics/analytics.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

# Replace:
# const startOfWeek = new Date(startOfToday);
# startOfWeek.setUTCDate(startOfToday.getUTCDate() - startOfToday.getUTCDay());

old_week = """    const startOfWeek = new Date(startOfToday);
    startOfWeek.setUTCDate(startOfToday.getUTCDate() - startOfToday.getUTCDay());"""

new_week = """    const startOfWeek = new Date(startOfToday);
    const day = startOfToday.getUTCDay() || 7;
    startOfWeek.setUTCDate(startOfToday.getUTCDate() - (day - 1));"""

code = code.replace(old_week, new_week)

with open("apps/api/src/modules/analytics/analytics.service.ts", "w", encoding="utf-8") as f:
    f.write(code)

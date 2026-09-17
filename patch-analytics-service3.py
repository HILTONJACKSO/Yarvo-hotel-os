import sys

with open("apps/api/src/modules/analytics/analytics.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("folioDiscounts.map(d => ({", "folioDiscounts.map((d: any) => ({")
code = code.replace("posDiscounts.map(d => ({", "posDiscounts.map((d: any) => ({")

with open("apps/api/src/modules/analytics/analytics.service.ts", "w", encoding="utf-8") as f:
    f.write(code)

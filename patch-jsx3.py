import sys
import re

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# I will find the payment form end and the closing brace and inject the closing fragment
pattern = r"(<button type=\"submit\" className=\"bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 p-2.5 rounded-lg font-bold transition-all\">Add Payment</button>\s*</form>\s*)(\)\})"
replacement = r"\1</>\n\2"

new_code = re.sub(pattern, replacement, code)

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_code)

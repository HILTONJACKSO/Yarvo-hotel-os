import sys

with open("apps/web/src/app/dashboard/staff/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("import { useAuth } from '@/hooks/useAuth';", "import { useAuth } from '@/lib/auth-provider';")

with open("apps/web/src/app/dashboard/staff/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

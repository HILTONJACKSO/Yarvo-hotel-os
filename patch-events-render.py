path = "apps/web/src/app/dashboard/events/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

import re

search_render = r"\{new Date\(date\)\.toLocaleDateString\(undefined, \{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' \}\)\}"
replace_render = "{new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}"

if re.search(search_render, c):
    c = re.sub(search_render, replace_render, c)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched render to avoid timezone shift")
else:
    print("Could not find render string")

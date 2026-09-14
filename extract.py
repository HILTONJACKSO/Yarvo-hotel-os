import sys

code=open('apps/web/src/app/dashboard/cashier/page.tsx', encoding='utf-8').read()
start = code.find('<div id="kwalee-receipt"')
end = code.find('</div>', code.find('<style>{`'))
print(code[start:end+500])

import sys

with open("apps/api/src/modules/folios/folios.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

old_desc = "description: paymentDto.description || 'Discount',"
new_desc = "description: paymentDto.description ? (paymentDto.description.toLowerCase().startsWith('discount') ? paymentDto.description : `Discount - ${paymentDto.description}`) : 'Discount',"

code = code.replace(old_desc, new_desc)

with open("apps/api/src/modules/folios/folios.service.ts", "w", encoding="utf-8") as f:
    f.write(code)

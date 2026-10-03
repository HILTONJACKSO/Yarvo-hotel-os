path = "apps/api/src/modules/folios/folios.service.ts"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

search_str = "description: paymentDto.description ? (paymentDto.description.toLowerCase().startsWith('discount') ? paymentDto.description : `Discount - ${paymentDto.description}`) : 'Discount',"

replace_str = "description: paymentDto.description ? (paymentDto.description.toLowerCase().startsWith('discount to register -') ? paymentDto.description : `Discount to register - ${paymentDto.description}`) : 'Discount to register - Folio Discount',"

if search_str in c:
    c = c.replace(search_str, replace_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched folios.service.ts discount description")
else:
    print("Could not find search_str")

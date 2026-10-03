path = "apps/web/src/app/dashboard/pos/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

search_str = "Settle Orders ({servedOrders.length})</button>"
replace_str = "Settle Orders ({servedOrders.length})</button>}"

if search_str in c:
    c = c.replace("<button className=\"btn-success btn-sm\" onClick={() => {fetchData(); setShowSettleModal(true);}}>Settle Orders", 
                  "{canSettleOrders && <button className=\"btn-success btn-sm\" onClick={() => {fetchData(); setShowSettleModal(true);}}>Settle Orders")
    c = c.replace("Settle Orders ({servedOrders.length})</button>", "Settle Orders ({servedOrders.length})</button>}")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched pos/page.tsx")
else:
    print("Not found")

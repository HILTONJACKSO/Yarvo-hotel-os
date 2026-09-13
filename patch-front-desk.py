import sys

with open('apps/web/src/app/dashboard/front-desk/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# I need to change how arrivals and departures are filtered on the client side.
old_logic = """      const arrData = await arrRes.json();
      const inHouseData = await inHouseRes.json();
      const authData = await authRes.json();
      const metData = await metRes.json();

      if (arrRes.ok && Array.isArray(arrData.data)) {
        setArrivals(arrData.data);
      }
      
      if (inHouseRes.ok && Array.isArray(inHouseData.data)) {
        setInHouse(inHouseData.data);
        // Simulate departures as anyone checked in (in a real app, this would be checked in + checkout date = today)
        setDepartures(inHouseData.data); 
      }"""

new_logic = """      const arrData = await arrRes.json();
      const inHouseData = await inHouseRes.json();
      const authData = await authRes.json();
      const metData = await metRes.json();

      const todayStr = new Date().toISOString().split('T')[0];

      if (arrRes.ok && Array.isArray(arrData.data)) {
        // Only show arrivals that are scheduled for check-in today (or in the past and overdue)
        const todaysArrivals = arrData.data.filter(r => r.checkInDate.split('T')[0] <= todayStr);
        setArrivals(todaysArrivals);
      }
      
      if (inHouseRes.ok && Array.isArray(inHouseData.data)) {
        setInHouse(inHouseData.data);
        // Only show departures that are scheduled for check-out today (or overdue)
        const todaysDepartures = inHouseData.data.filter(r => r.checkOutDate.split('T')[0] <= todayStr);
        setDepartures(todaysDepartures); 
      }"""

code = code.replace(old_logic, new_logic)

with open('apps/web/src/app/dashboard/front-desk/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

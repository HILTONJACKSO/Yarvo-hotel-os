path = "apps/web/src/components/rooms/AddRoomModal.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

search = """      const url = initialData ? `/api/v1/rooms/${initialData.id}` : '/api/v1/rooms';
      const method = initialData ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });"""

replace = """      const url = initialData ? `/api/v1/rooms/${initialData.id}` : '/api/v1/rooms';
      const method = initialData ? 'PATCH' : 'POST';
      
      const { status, ...submitData } = data;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });"""

c = c.replace(search, replace)
with open(path, "w", encoding="utf-8") as f:
    f.write(c)
print("Patched payload")

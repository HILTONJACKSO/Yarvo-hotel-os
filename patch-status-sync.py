path = "apps/web/src/components/rooms/AddRoomModal.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

search = """      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Failed to ${initialData ? 'edit' : 'add'} room`);
      
      onSuccess();
      onClose();"""

replace = """      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Failed to ${initialData ? 'edit' : 'add'} room`);
      
      if (initialData && data.status && data.status !== initialData.status) {
        await fetch(`/api/v1/rooms/${initialData.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: data.status, reason: 'Manually changed from Rooms Dashboard' })
        });
      }
      
      onSuccess();
      onClose();"""

c = c.replace(search, replace)
with open(path, "w", encoding="utf-8") as f:
    f.write(c)
print("Patched status sync correctly")

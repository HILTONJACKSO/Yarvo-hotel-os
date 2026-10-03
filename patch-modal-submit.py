path = "apps/web/src/components/rooms/AddRoomModal.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

import re

search = """      if (res.ok) {
        showToast(`Room successfully ${initialData ? 'updated' : 'added'}!`, 'success', 'Success');
        onSuccess();
        onClose();
      } else {"""

replace = """      if (res.ok) {
        // If status was changed, we need to call the status endpoint
        if (initialData && data.status && data.status !== initialData.status) {
          await fetch(`/api/v1/rooms/${initialData.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: data.status, reason: 'Manually changed from Rooms Dashboard' })
          });
        }
        
        showToast(`Room successfully ${initialData ? 'updated' : 'added'}!`, 'success', 'Success');
        onSuccess();
        onClose();
      } else {"""

c = c.replace(search, replace)
with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("Patched AddRoomModal submit logic")

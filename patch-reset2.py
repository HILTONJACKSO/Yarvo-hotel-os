path = "apps/web/src/components/rooms/AddRoomModal.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

search = """        reset({
          number: initialData.number,
          floor: initialData.floor,
          roomTypeId: initialData.roomType?.id || initialData.roomTypeId,
          notes: initialData.notes || '',
        });"""

replace = """        reset({
          number: initialData.number,
          floor: initialData.floor,
          roomTypeId: initialData.roomType?.id || initialData.roomTypeId,
          notes: initialData.notes || '',
          status: initialData.status,
        });"""

c = c.replace(search, replace)
with open(path, "w", encoding="utf-8") as f:
    f.write(c)
print("Patched reset")

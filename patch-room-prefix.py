import os

paths = [
    "apps/web/src/components/reservations/NewReservationModal.tsx",
    "apps/web/src/components/reservations/ManageReservationModal.tsx",
    "apps/web/src/app/dashboard/pos/page.tsx",
    "apps/web/src/app/dashboard/reservations/page.tsx"
]

for p in paths:
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()
    c = c.replace('Room {r.number}', '{r.number}')
    c = c.replace('Room {r.room?.number', '{r.room?.number')
    c = c.replace('Room {so.folio.reservation.room.number}', '{so.folio.reservation.room.number}')
    c = c.replace('`Room ${res.room.number}`', 'res.room.number')
    with open(p, "w", encoding="utf-8") as f:
        f.write(c)

print("Removed hardcoded 'Room' prefixes")

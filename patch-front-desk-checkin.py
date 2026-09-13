import sys
import re

# 1. Update front-desk/page.tsx
with open('apps/web/src/app/dashboard/front-desk/page.tsx', 'r', encoding='utf-8') as f:
    fd_code = f.read()

# Add state for activePreAssignedRoomId
fd_code = fd_code.replace(
    'const [activeRoomTypeId, setActiveRoomTypeId] = useState<string | null>(null);',
    'const [activeRoomTypeId, setActiveRoomTypeId] = useState<string | null>(null);\n  const [activePreAssignedRoomId, setActivePreAssignedRoomId] = useState<string | null>(null);'
)

# Modify handleCheckIn signature and logic
old_handle = """  const handleCheckIn = (resId: string, roomTypeId: string) => {
    setActiveReservationId(resId);
    setActiveRoomTypeId(roomTypeId);
    setIsCheckInOpen(true);
  };"""
new_handle = """  const handleCheckIn = (res: any) => {
    setActiveReservationId(res.id);
    setActiveRoomTypeId(res.roomType.id);
    setActivePreAssignedRoomId(res.room ? res.room.id : null);
    setIsCheckInOpen(true);
  };"""
fd_code = fd_code.replace(old_handle, new_handle)

# Modify the Check In button call
fd_code = fd_code.replace(
    'onClick={() => handleCheckIn(res.id, res.roomType.id)}',
    'onClick={() => handleCheckIn(res)}'
)

# Pass it to CheckInModal
fd_code = fd_code.replace(
    'roomTypeId={activeRoomTypeId}',
    'roomTypeId={activeRoomTypeId}\n          preAssignedRoomId={activePreAssignedRoomId}'
)

with open('apps/web/src/app/dashboard/front-desk/page.tsx', 'w', encoding='utf-8') as f:
    f.write(fd_code)


# 2. Update CheckInModal.tsx
with open('apps/web/src/components/front-desk/CheckInModal.tsx', 'r', encoding='utf-8') as f:
    modal_code = f.read()

modal_code = modal_code.replace(
    'roomTypeId: string | null;',
    'roomTypeId: string | null;\n  preAssignedRoomId: string | null;'
)

modal_code = modal_code.replace(
    'export function CheckInModal({ isOpen, onClose, onSuccess, reservationId, roomTypeId }: Props) {',
    'export function CheckInModal({ isOpen, onClose, onSuccess, reservationId, roomTypeId, preAssignedRoomId }: Props) {'
)

modal_code = modal_code.replace(
    'resolver: zodResolver(schema),',
    'resolver: zodResolver(schema),\n    defaultValues: { roomId: preAssignedRoomId || "" },'
)

# Also need to reset it dynamically when preAssignedRoomId changes
modal_code = modal_code.replace(
    'reset();',
    'reset({ roomId: preAssignedRoomId || "" });'
)

# Change the text to reflect pre-assigned status
old_info = '<p>Please select a clean room to assign to this reservation.</p>'
new_info = '<p>{preAssignedRoomId ? "A room was already assigned during booking. You can confirm or change it." : "Please select a clean room to assign to this reservation."}</p>'
modal_code = modal_code.replace(old_info, new_info)

with open('apps/web/src/components/front-desk/CheckInModal.tsx', 'w', encoding='utf-8') as f:
    f.write(modal_code)


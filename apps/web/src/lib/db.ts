import Dexie, { Table } from 'dexie';

export interface Room {
  id: string;
  number: string;
  roomTypeId: string;
  floor: number;
  status: string;
  condition: string;
  isActive: boolean;
  notes?: string; roomType?: any;
  updatedAt: string; // Used for sync
}

export interface Reservation { folio?: any; guest?: any; room?: any; 
  id: string;
  confirmationCode: string;
  guestId: string;
  roomTypeId: string;
  roomId?: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string | number;
  adultsCount: number;
  childrenCount: number;
  specialRequests?: string;
  updatedAt: string;
}


export interface PosTable { id: string; number: string; capacity: number; isActive: boolean; updatedAt: string; }
export interface PosCategory { id: string; name: string; isActive: boolean; updatedAt: string; }
export interface PosMenuItem { recipes?: any[];  id: string; name: string; description?: string; price: number | string; categoryId: string; type: string; image?: string; isAvailable: boolean; updatedAt: string; }
export interface EventSpace {
  id: string;
  name: string;
  capacity: number;
  pricePerHour: number | string;
  pricePerDay: number | string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventBooking {
  id: string;
  spaceId: string;
  space?: any;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  eventType: string;
  attendeesCount: number;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number | string;
  amountPaid: number | string;
  specialRequests?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomType {
  id: string;
  name: string;
  code: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Folio {
  id: string;
  reservationId?: string;
  reservation?: any;
  status: string;
  balance: number | string;
  lineItems?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  roomId?: string;
  room?: any;
  type: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PosOrder { createdAt?: string; notes?: string | null; discountAmount?: number | string; invoicePrintCount?: number; receiptPrintCount?: number;  table?: any; folio?: any; folioId?: string; user?: any;  id: string; orderNumber: string; tableId?: string; guestId?: string; status: string; totalAmount: number | string; destinationDept?: string; destinationType?: string; items: any[]; updatedAt: string; }


export interface InventoryItem { id: string; name: string; category: string; unit: string; stockLevel: string; stockMain: string; stockKitchen: string; stockBar: string; stockHousekeeping: string; stockBoutique: string; minThreshold: string; costPerUnit: string; updatedAt?: string; }
export interface Tax { isActive?: boolean;  id: string; name: string; rate: number; isDefault: boolean; type: string; updatedAt: string; }

export interface Guest { companyName?: string; nationality?: string; address?: string; 
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  updatedAt: string;
}

export interface SyncOperation {
  id?: number; // Auto-incremented local ID
  url: string;
  method: string;
  payload: any;
  createdAt: number;
  status: 'PENDING' | 'FAILED';
  retryCount: number;
  error?: string;
}

export class KwaleeLocalDatabase extends Dexie {
  rooms!: Table<Room, string>;
  reservations!: Table<Reservation, string>;
  guests!: Table<Guest, string>;
  inventory!: Table<InventoryItem, string>;
  taxes!: Table<Tax, string>;

  posTables!: Table<PosTable, string>;
  posCategories!: Table<PosCategory, string>;
  posMenuItems!: Table<PosMenuItem, string>;
  eventSpaces!: Table<EventSpace, string>;
  eventBookings!: Table<EventBooking, string>;
  roomTypes!: Table<RoomType, string>;
  folios!: Table<Folio, string>;
  workOrders!: Table<WorkOrder, string>;
  posOrders!: Table<PosOrder, string>;

  syncQueue!: Table<SyncOperation, number>;

  constructor() {
    super('KwaleeLocalDB');
    this.version(3).stores({
      rooms: 'id, roomTypeId, status, updatedAt',
      reservations: 'id, confirmationCode, guestId, roomId, status, checkInDate, checkOutDate, updatedAt',
      guests: 'id, email, phone, updatedAt',
      inventory: 'id, name, category, updatedAt',
      taxes: 'id, name, isDefault, updatedAt',
      posTables: 'id, number, updatedAt',
      posCategories: 'id, name, updatedAt',
      posMenuItems: 'id, categoryId, type, updatedAt',
      posOrders: 'id, tableId, guestId, status, updatedAt',
      syncQueue: '++id, status, createdAt',
    });
  }
}

export const db = new KwaleeLocalDatabase();

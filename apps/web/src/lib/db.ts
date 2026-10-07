import Dexie, { Table } from 'dexie';

export interface Room {
  id: string;
  number: string;
  roomTypeId: string;
  floor: number;
  status: string;
  condition: string;
  isActive: boolean;
  notes?: string;
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
export interface PosOrder { table?: any; folio?: any; folioId?: string; user?: any;  id: string; orderNumber: string; tableId?: string; guestId?: string; status: string; totalAmount: number | string; destinationDept?: string; destinationType?: string; items: any[]; updatedAt: string; }


export interface InventoryItem { id: string; name: string; sku?: string; quantity: number; unit: string; minStockLevel: number; category: string; costPrice: number; sellingPrice?: number; updatedAt: string; }
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

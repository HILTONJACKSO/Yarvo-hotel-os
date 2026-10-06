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

export interface Reservation {
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

export interface Guest {
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
  syncQueue!: Table<SyncOperation, number>;

  constructor() {
    super('KwaleeLocalDB');
    this.version(1).stores({
      rooms: 'id, roomTypeId, status, updatedAt',
      reservations: 'id, confirmationCode, guestId, roomId, status, checkInDate, checkOutDate, updatedAt',
      guests: 'id, email, phone, updatedAt',
      syncQueue: '++id, status, createdAt',
    });
  }
}

export const db = new KwaleeLocalDatabase();

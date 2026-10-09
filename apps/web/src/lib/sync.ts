import { db } from './db';

// This function will be called whenever the app comes online
export async function syncOfflineMutations() {
  const pendingMutations = await db.syncQueue
    .where('status')
    .equals('PENDING')
    .sortBy('createdAt');

  for (const mutation of pendingMutations) {
    try {
      console.log(`Syncing mutation: ${mutation.method} ${mutation.url}`);
      
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: {
          'Content-Type': 'application/json',
          // Assuming token is in cookies, fetch will send it automatically if credentials included
        },
          credentials: 'include',
        body: mutation.payload ? JSON.stringify(mutation.payload) : undefined,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      // Success, remove from queue
      await db.syncQueue.delete(mutation.id!);
      
    } catch (err: any) {
      console.error('Sync failed for mutation:', mutation, err);
      // Increment retry count
      await db.syncQueue.update(mutation.id!, {
        retryCount: mutation.retryCount + 1,
        error: err.message,
      });
      // Stop syncing this batch if we hit a network error to preserve order
      break; 
    }
  }
}

// Function to fetch latest data from server and populate Dexie
export async function downloadLatestData() {
  try {
    // 1. Fetch Rooms
    const roomsRes = await fetch('/api/v1/rooms');
    if (roomsRes.ok) {
      const data = await roomsRes.json();
      if (data.data) {
        await db.rooms.bulkPut(data.data);
      }
    }

    // 2. Fetch Reservations
    const resRes = await fetch('/api/v1/reservations');
    if (resRes.ok) {
      const data = await resRes.json();
      if (data.data) {
        await db.reservations.bulkPut(data.data);
      }
    }

    // 3. Fetch Guests 
    const guestRes = await fetch('/api/v1/guests?limit=1000');
    if (guestRes.ok) {
      const data = await guestRes.json();
      if (data.data) {
        await db.guests.bulkPut(data.data);
      }
    }

    // 4. Fetch POS Data
    const [ptRes, pcRes, pmRes, poRes, psRes] = await Promise.all([
      fetch('/api/v1/pos/tables'),
      fetch('/api/v1/pos/categories'),
      fetch('/api/v1/pos/menu-items?limit=1000'),
      fetch('/api/v1/pos/orders'), // Currently active orders
      fetch('/api/v1/pos/served-orders') // Served orders for cashier
    ]);

    if (ptRes.ok) { const d = await ptRes.json(); if (d.data) await db.posTables.bulkPut(d.data); }
    if (pcRes.ok) { const d = await pcRes.json(); if (d.data) await db.posCategories.bulkPut(d.data); }
    if (pmRes.ok) { const d = await pmRes.json(); if (d.data) await db.posMenuItems.bulkPut(d.data); }
    if (poRes.ok) { const d = await poRes.json(); if (d.data) await db.posOrders.bulkPut(d.data); }
    if (psRes.ok) { const d = await psRes.json(); if (d.data) await db.posOrders.bulkPut(d.data); }

    // 5. Fetch Inventory & Taxes
    const [invRes, taxRes] = await Promise.all([
      fetch('/api/v1/inventory?limit=1000'),
      fetch('/api/v1/taxes')
    ]);
    if (invRes.ok) { const d = await invRes.json(); if (d.data) await db.inventory.bulkPut(d.data); }
    if (taxRes.ok) { const d = await taxRes.json(); if (d.data) await db.taxes.bulkPut(Array.isArray(d.data) ? d.data : []); }
    
    
    // 6. Fetch Work Orders
    const woRes = await fetch('/api/v1/work-orders');
    if (woRes.ok) {
      const d = await woRes.json();
      if (d.data || Array.isArray(d)) {
        await db.workOrders.bulkPut(d.data || d);
      }
    }

    
    // 7. Fetch Folios
    const foliosRes = await fetch('/api/v1/folios?status=OPEN');
    if (foliosRes.ok) {
      const d = await foliosRes.json();
      if (d.data || Array.isArray(d)) {
        await db.folios.bulkPut(d.data || d);
      }
    }

    
    // 8. Fetch Room Types
    const roomTypesRes = await fetch('/api/v1/room-types');
    if (roomTypesRes.ok) {
      const d = await roomTypesRes.json();
      if (d.data || Array.isArray(d)) {
        await db.roomTypes.bulkPut(d.data || d);
      }
    }

    
    // 9. Fetch Event Spaces and Bookings
    const spacesRes = await fetch('/api/v1/events/spaces');
    if (spacesRes.ok) {
      const d = await spacesRes.json();
      if (d.data || Array.isArray(d)) {
        await db.eventSpaces.bulkPut(d.data || d);
      }
    }
    const bookingsRes = await fetch('/api/v1/events/bookings');
    if (bookingsRes.ok) {
      const d = await bookingsRes.json();
      if (d.data || Array.isArray(d)) {
        await db.eventBookings.bulkPut(d.data || d);
      }
    }

    
    // 10. Fetch Property
    const propsRes = await fetch('/api/v1/properties');
    if (propsRes.ok) {
      const d = await propsRes.json();
      if (d.data || d) {
        await db.properties.put(d.data || d);
      }
    }

    
    // 11. Fetch Companies
    const compRes = await fetch('/api/v1/companies');
    if (compRes.ok) {
      const d = await compRes.json();
      if (d.data) await db.companies.bulkPut(d.data);
    }

    
    // 12. Fetch Expenses
    const expRes = await fetch('/api/v1/expenses');
    if (expRes.ok) {
      const d = await expRes.json();
      if (d.data) await db.expenses.bulkPut(d.data);
    }

    console.log('Background sync (download) complete.');
  } catch (err) {
    console.error('Failed to download latest data:', err);
  }
}

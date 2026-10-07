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
    const [ptRes, pcRes, pmRes, poRes] = await Promise.all([
      fetch('/api/v1/pos/tables'),
      fetch('/api/v1/pos/categories'),
      fetch('/api/v1/pos/menu-items?limit=1000'),
      fetch('/api/v1/pos/orders') // Currently active orders
    ]);

    if (ptRes.ok) { const d = await ptRes.json(); if (d.data) await db.posTables.bulkPut(d.data); }
    if (pcRes.ok) { const d = await pcRes.json(); if (d.data) await db.posCategories.bulkPut(d.data); }
    if (pmRes.ok) { const d = await pmRes.json(); if (d.data) await db.posMenuItems.bulkPut(d.data); }
    if (poRes.ok) { const d = await poRes.json(); if (d.data) await db.posOrders.bulkPut(d.data); }

    // 5. Fetch Inventory & Taxes
    const [invRes, taxRes] = await Promise.all([
      fetch('/api/v1/inventory?limit=1000'),
      fetch('/api/v1/taxes')
    ]);
    if (invRes.ok) { const d = await invRes.json(); if (d.data) await db.inventory.bulkPut(d.data); }
    if (taxRes.ok) { const d = await taxRes.json(); if (d.data) await db.taxes.bulkPut(Array.isArray(d.data) ? d.data : []); }
    
    console.log('Background sync (download) complete.');
  } catch (err) {
    console.error('Failed to download latest data:', err);
  }
}

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

    // 3. Fetch Guests (usually embedded or fetched separately)
    // ...
    
    console.log('Background sync (download) complete.');
  } catch (err) {
    console.error('Failed to download latest data:', err);
  }
}

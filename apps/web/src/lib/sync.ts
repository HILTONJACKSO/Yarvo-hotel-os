import { db } from './db';

let isSyncing = false;

// This function will be called whenever the app comes online
export async function syncOfflineMutations() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const pendingMutations = await db.syncQueue
      .where('status')
      .equals('PENDING')
      .sortBy('createdAt');

    for (const mutation of pendingMutations) {
      try {
        console.log(`Syncing mutation: ${mutation.method} ${mutation.url}`);
        
        const headers: Record<string, string> = {};
        let body: string | undefined = undefined;

        if (mutation.payload !== undefined && mutation.payload !== null) {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(mutation.payload);
        } else if (['POST', 'PATCH', 'PUT'].includes(mutation.method)) {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify({});
        }

        let res = await fetch(mutation.url, {
          method: mutation.method,
          headers,
          credentials: 'include',
          body,
        });

        // If 401 Unauthorized, try to refresh session token and retry once
        if (res.status === 401) {
          try {
            const refreshRes = await fetch('/api/v1/auth/refresh', {
              method: 'POST',
              credentials: 'include',
            });
            if (refreshRes.ok) {
              res = await fetch(mutation.url, {
                method: mutation.method,
                headers,
                credentials: 'include',
                body,
              });
            }
          } catch (e) {
            console.error('Failed to auto-refresh session during sync:', e);
          }
        }

        if (!res.ok) {
          // If 401 Unauthorized, give it up to 2 retries then quarantine so queue isn't blocked forever
          if (res.status === 401) {
            if ((mutation.retryCount || 0) >= 2) {
              console.error(`Quarantining unauthorized mutation ${mutation.id} (${mutation.url})`);
              await db.syncQueue.update(mutation.id!, {
                status: 'FAILED',
                retryCount: (mutation.retryCount || 0) + 1,
                error: 'Unauthorized (401)',
              });
              continue;
            }
          } else if (res.status >= 400 && res.status < 500) {
            // Discard client-side invalid requests (400, 404, etc.)
            console.error(`Discarding invalid mutation ${mutation.id} due to ${res.status}`);
            await db.syncQueue.delete(mutation.id!);
            continue;
          }
          throw new Error(`Server returned ${res.status}`);
        }

        // Success, remove from queue
        await db.syncQueue.delete(mutation.id!);
        
      } catch (err: any) {
        console.error('Sync failed for mutation:', mutation, err);
        const newRetryCount = (mutation.retryCount || 0) + 1;
        if (newRetryCount >= 4) {
          console.warn(`Quarantining repeatedly failing mutation ${mutation.id} (${mutation.method} ${mutation.url})`);
          await db.syncQueue.update(mutation.id!, {
            status: 'FAILED',
            retryCount: newRetryCount,
            error: err.message,
          });
          continue; // Allow subsequent mutations to be processed
        } else {
          // Increment retry count
          await db.syncQueue.update(mutation.id!, {
            retryCount: newRetryCount,
            error: err.message,
          });
          // Stop syncing this batch if we hit a network error to preserve order
          break; 
        }
      }
    }
  } finally {
    isSyncing = false;
  }
}

function extractArray(resData: any): any[] {
  if (!resData) return [];
  if (Array.isArray(resData.data)) return resData.data;
  if (Array.isArray(resData)) return resData;
  return [];
}

// Function to fetch latest data from server and populate Dexie
export async function downloadLatestData() {
  try {
    // 1. Fetch Rooms
    const roomsRes = await fetch('/api/v1/rooms', { credentials: 'include' });
    if (roomsRes.ok) {
      const data = await roomsRes.json();
      const serverRooms = extractArray(data);
      if (serverRooms.length > 0 || (data.data && Array.isArray(data.data))) {
        const serverIds = new Set(serverRooms.map((r: any) => r.id));
        const localRooms = await db.rooms.toArray();
        for (const lr of localRooms) {
          if (!serverIds.has(lr.id)) {
            await db.rooms.delete(lr.id);
          }
        }
        if (serverRooms.length > 0) {
          await db.rooms.bulkPut(serverRooms);
        }
      }
    }

    // 2. Fetch Reservations
    const resRes = await fetch('/api/v1/reservations', { credentials: 'include' });
    if (resRes.ok) {
      const data = await resRes.json();
      const serverRes = extractArray(data);
      if (serverRes.length > 0) {
        await db.reservations.bulkPut(serverRes);
      }
    }

    // 3. Fetch Guests 
    const guestRes = await fetch('/api/v1/guests?limit=1000', { credentials: 'include' });
    if (guestRes.ok) {
      const data = await guestRes.json();
      const serverGuests = extractArray(data);
      if (serverGuests.length > 0) {
        await db.guests.bulkPut(serverGuests);
      }
    }

    // 4. Fetch POS Data
    const [ptRes, pcRes, pmRes, poRes, psRes] = await Promise.all([
      fetch('/api/v1/pos/tables', { credentials: 'include' }),
      fetch('/api/v1/pos/categories', { credentials: 'include' }),
      fetch('/api/v1/pos/menu-items?limit=1000', { credentials: 'include' }),
      fetch('/api/v1/pos/orders', { credentials: 'include' }), // Currently active orders
      fetch('/api/v1/pos/served-orders', { credentials: 'include' }) // Served orders for cashier
    ]);

    // 4a. Tables Reconciliation
    if (ptRes.ok) {
      const d = await ptRes.json();
      const serverTables = extractArray(d);
      const serverIds = new Set(serverTables.map((t: any) => t.id));
      const localTables = await db.posTables.toArray();
      for (const lt of localTables) {
        if (!serverIds.has(lt.id)) {
          await db.posTables.delete(lt.id);
        }
      }
      if (serverTables.length > 0) {
        await db.posTables.bulkPut(serverTables);
      }
    }

    // 4b. Categories Reconciliation
    if (pcRes.ok) {
      const d = await pcRes.json();
      const serverCats = extractArray(d);
      const serverIds = new Set(serverCats.map((c: any) => c.id));
      const localCats = await db.posCategories.toArray();
      for (const lc of localCats) {
        if (!serverIds.has(lc.id)) {
          await db.posCategories.delete(lc.id);
        }
      }
      if (serverCats.length > 0) {
        await db.posCategories.bulkPut(serverCats);
      }
    }

    // 4c. Menu Items Reconciliation
    if (pmRes.ok) {
      const d = await pmRes.json();
      const serverItems = extractArray(d);
      const serverIds = new Set(serverItems.map((m: any) => m.id));
      const localItems = await db.posMenuItems.toArray();
      for (const li of localItems) {
        if (!serverIds.has(li.id)) {
          await db.posMenuItems.delete(li.id);
        }
      }
      if (serverItems.length > 0) {
        await db.posMenuItems.bulkPut(serverItems);
      }
    }
    
    // 4d. POS Orders
    const serverOrders: any[] = [];
    if (poRes.ok) { const d = await poRes.json(); serverOrders.push(...extractArray(d)); }
    if (psRes.ok) { const d = await psRes.json(); serverOrders.push(...extractArray(d)); }
    
    if (poRes.ok || psRes.ok) {
      if (serverOrders.length > 0) {
        // Protect optimistic local status updates that are currently pending in syncQueue
        const pendingStatusUpdates = await db.syncQueue
          .where('status')
          .equals('PENDING')
          .filter(m => m.url.includes('/api/v1/pos/order-items/') && m.url.endsWith('/status'))
          .toArray();

        if (pendingStatusUpdates.length > 0) {
          const pendingItemStatusMap = new Map<string, string>();
          for (const m of pendingStatusUpdates) {
            const match = m.url.match(/\/order-items\/([^/]+)\/status/);
            if (match && match[1] && m.payload?.status) {
              pendingItemStatusMap.set(match[1], m.payload.status);
            }
          }
          for (const order of serverOrders) {
            if (Array.isArray(order.items)) {
              for (const it of order.items) {
                if (pendingItemStatusMap.has(it.id)) {
                  it.status = pendingItemStatusMap.get(it.id);
                }
              }
            }
          }
        }

        const pendingDeliverAlls = await db.syncQueue
          .where('status')
          .equals('PENDING')
          .filter(m => m.url.includes('/deliver-all'))
          .toArray();

        if (pendingDeliverAlls.length > 0) {
          const pendingDeliveredItemIds = new Set<string>();
          for (const m of pendingDeliverAlls) {
            if (Array.isArray(m.payload?.itemIds)) {
              m.payload.itemIds.forEach((id: string) => pendingDeliveredItemIds.add(id));
            }
          }
          for (const order of serverOrders) {
            if (Array.isArray(order.items)) {
              for (const it of order.items) {
                if (pendingDeliveredItemIds.has(it.id)) {
                  it.status = 'SERVED';
                }
              }
            }
          }
        }

        await db.posOrders.bulkPut(serverOrders);
      }
      // Reconcile: If local order is in local Dexie but server no longer considers it active (or it was settled/paid on server, or empty)
      const serverActiveIds = new Set(serverOrders.map((o: any) => o.id));
      const localOrders = await db.posOrders.toArray();
      for (const lo of localOrders) {
        if (!serverActiveIds.has(lo.id) || lo.status === 'PAID' || lo.status === 'CANCELLED' || (!lo.items || lo.items.length === 0)) {
          await db.posOrders.delete(lo.id);
          const pendingCheckout = await db.syncQueue.where('url').equals(`/api/v1/pos/orders/${lo.id}/checkout`).toArray();
          for (const item of pendingCheckout) {
            if (item.id) await db.syncQueue.delete(item.id);
          }
        }
      }
    }

    // 5. Fetch Inventory & Taxes
    const [invRes, taxRes] = await Promise.all([
      fetch('/api/v1/inventory?limit=1000', { credentials: 'include' }),
      fetch('/api/v1/taxes', { credentials: 'include' })
    ]);
    if (invRes.ok) {
      const d = await invRes.json();
      const serverItems = extractArray(d);
      if (serverItems.length > 0 || (d.data && Array.isArray(d.data))) {
        const serverIds = new Set(serverItems.map((i: any) => i.id));
        const localItems = await db.inventory.toArray();
        for (const li of localItems) {
          if (!serverIds.has(li.id)) {
            await db.inventory.delete(li.id);
          }
        }
        if (serverItems.length > 0) {
          await db.inventory.bulkPut(serverItems);
        }
      }
    }
    if (taxRes.ok) { const d = await taxRes.json(); const taxes = extractArray(d); if (taxes.length > 0) await db.taxes.bulkPut(taxes); }
    
    
    // 6. Fetch Work Orders
    const woRes = await fetch('/api/v1/work-orders', { credentials: 'include' });
    if (woRes.ok) {
      const d = await woRes.json();
      const orders = extractArray(d);
      if (orders.length > 0) {
        await db.workOrders.bulkPut(orders);
      }
    }

    
    // 7. Fetch Folios
    const foliosRes = await fetch('/api/v1/folios?status=OPEN', { credentials: 'include' });
    if (foliosRes.ok) {
      const d = await foliosRes.json();
      const folios = extractArray(d);
      const serverIds = new Set(folios.map((f: any) => f.id));
      const localFolios = await db.folios.toArray();
      const toDelete = localFolios.filter((f: any) => !serverIds.has(f.id)).map((f: any) => f.id);
      if (toDelete.length > 0) {
        await db.folios.bulkDelete(toDelete);
      }
      if (folios.length > 0) {
        await db.folios.bulkPut(folios);
      }
    }

    
    // 8. Fetch Room Types
    const roomTypesRes = await fetch('/api/v1/room-types', { credentials: 'include' });
    if (roomTypesRes.ok) {
      const d = await roomTypesRes.json();
      const serverRoomTypes = extractArray(d);
      const serverIds = new Set(serverRoomTypes.map((rt: any) => rt.id));
      const localRoomTypes = await db.roomTypes.toArray();
      for (const lrt of localRoomTypes) {
        if (!serverIds.has(lrt.id)) {
          await db.roomTypes.delete(lrt.id);
        }
      }
      if (serverRoomTypes.length > 0) {
        await db.roomTypes.bulkPut(serverRoomTypes);
      }
    }

    
    // 9. Fetch Event Spaces and Bookings
    const spacesRes = await fetch('/api/v1/events/spaces', { credentials: 'include' });
    if (spacesRes.ok) {
      const d = await spacesRes.json();
      const spaces = extractArray(d);
      if (spaces.length > 0) {
        await db.eventSpaces.bulkPut(spaces);
      }
    }
    const bookingsRes = await fetch('/api/v1/events/bookings', { credentials: 'include' });
    if (bookingsRes.ok) {
      const d = await bookingsRes.json();
      const bookings = extractArray(d);
      if (bookings.length > 0) {
        await db.eventBookings.bulkPut(bookings);
      }
    }

    
    // 10. Fetch Property
    const propsRes = await fetch('/api/v1/properties', { credentials: 'include' });
    if (propsRes.ok) {
      const d = await propsRes.json();
      const prop = d.data || d;
      if (prop && prop.id) {
        await db.properties.put(prop);
      }
    }

    
    // 11. Fetch Companies
    const compRes = await fetch('/api/v1/companies', { credentials: 'include' });
    if (compRes.ok) {
      const d = await compRes.json();
      const comps = extractArray(d);
      if (comps.length > 0) await db.companies.bulkPut(comps);
    }

    
    // 12. Fetch Expenses
    const expRes = await fetch('/api/v1/expenses', { credentials: 'include' });
    if (expRes.ok) {
      const d = await expRes.json();
      const exps = extractArray(d);
      if (exps.length > 0) await db.expenses.bulkPut(exps);
    }

    console.log('Background sync (download) complete.');
  } catch (err) {
    console.error('Failed to download latest data:', err);
  }
}

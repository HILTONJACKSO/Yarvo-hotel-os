import { db } from './db';

let isSyncing = false;
let refreshInFlight: Promise<boolean> | null = null;
let posSyncInFlight: Promise<void> | null = null;

// Short-lived shield preventing in-flight polls from re-inserting an order right after settlement
const recentlySettledOrders = new Map<string, number>();
const SETTLED_SHIELD_TTL_MS = 90_000;

function isRecentlySettled(orderId: string): boolean {
  const ts = recentlySettledOrders.get(orderId);
  if (!ts) return false;
  if (Date.now() - ts > SETTLED_SHIELD_TTL_MS) {
    recentlySettledOrders.delete(orderId);
    return false;
  }
  return true;
}

export async function markOrderSettledLocally(orderId: string): Promise<void> {
  if (!orderId) return;
  recentlySettledOrders.set(orderId, Date.now());
  await db.posOrders.delete(orderId).catch(() => {});

  // Remove any obsolete status/deliver mutations for this settled order (keep offline checkout if offline)
  const staleOps = await db.syncQueue
    .filter(
      (m) =>
        m.url.includes(orderId) &&
        !m.url.endsWith(`/orders/${orderId}/checkout`)
    )
    .toArray()
    .catch(() => []);

  for (const op of staleOps) {
    if (op.id !== undefined) {
      await db.syncQueue.delete(op.id).catch(() => {});
    }
  }
}

async function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const mergedInit: RequestInit = {
    credentials: 'include',
    cache: 'no-store',
    ...init,
  };
  let res = await fetch(input, mergedInit);
  if (res.status === 401) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      res = await fetch(input, mergedInit);
    }
  }
  return res;
}

// Push queued offline mutations to the server
export async function syncOfflineMutations() {
  if (isSyncing) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  isSyncing = true;

  try {
    const pendingMutations = await db.syncQueue
      .where('status')
      .equals('PENDING')
      .sortBy('createdAt');

    for (const mutation of pendingMutations) {
      try {
        const headers: Record<string, string> = {};
        let body: string | undefined = undefined;

        if (mutation.payload !== undefined && mutation.payload !== null) {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(mutation.payload);
        } else if (['POST', 'PATCH', 'PUT'].includes(mutation.method)) {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify({});
        }

        const res = await fetchWithAuth(mutation.url, {
          method: mutation.method,
          headers,
          body,
        });

        if (!res.ok) {
          if (res.status === 401) {
            if ((mutation.retryCount || 0) >= 2) {
              await db.syncQueue.update(mutation.id!, {
                status: 'FAILED',
                retryCount: (mutation.retryCount || 0) + 1,
                error: 'Unauthorized (401)',
              });
              continue;
            }
          } else if (res.status >= 400 && res.status < 500) {
            // Discard client-side invalid or obsolete requests (400, 404, 409, etc.)
            await db.syncQueue.delete(mutation.id!);
            continue;
          }
          throw new Error(`Server returned ${res.status}`);
        }

        await db.syncQueue.delete(mutation.id!);
      } catch (err: any) {
        const newRetryCount = (mutation.retryCount || 0) + 1;
        if (newRetryCount >= 4) {
          await db.syncQueue.update(mutation.id!, {
            status: 'FAILED',
            retryCount: newRetryCount,
            error: err.message,
          });
          continue;
        } else {
          await db.syncQueue.update(mutation.id!, {
            retryCount: newRetryCount,
            error: err.message,
          });
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
  if (Array.isArray(resData?.data?.data)) return resData.data.data;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData)) return resData;
  return [];
}

// Fast, dedicated POS order synchronization for Cashier, Kitchen, Bar, Waitstaff, and POS Terminal
export async function syncPosOrders(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  if (posSyncInFlight) return posSyncInFlight;

  posSyncInFlight = (async () => {
    try {
      // 1. Always flush pending offline mutations first so status/delivery/checkout changes hit the server
      await syncOfflineMutations();

      // 2. Clean up stale item-status / deliver-all mutations older than 45s while online so they never mask server truth
      const now = Date.now();
      const stalePosMutations = await db.syncQueue
        .where('status')
        .equals('PENDING')
        .filter(
          (m) =>
            now - m.createdAt > 45_000 &&
            ((m.url.includes('/api/v1/pos/order-items/') && m.url.endsWith('/status')) ||
              m.url.includes('/deliver-all'))
        )
        .toArray()
        .catch(() => []);

      for (const stale of stalePosMutations) {
        if (stale.id !== undefined) {
          await db.syncQueue.delete(stale.id).catch(() => {});
        }
      }

      // 3. Fetch authoritative active + served POS orders from server
      const [poRes, psRes] = await Promise.all([
        fetchWithAuth('/api/v1/pos/orders'),
        fetchWithAuth('/api/v1/pos/served-orders'),
      ]);

      if (!poRes.ok && !psRes.ok) return;

      // Deduplicate orders returned by both /orders and /served-orders
      const orderMap = new Map<string, any>();
      const ingest = (list: any[]) => {
        for (const o of list) {
          if (!o || !o.id) continue;
          if (isRecentlySettled(o.id)) continue;
          if (['PAID', 'BILLED_TO_ROOM', 'CANCELLED'].includes(o.status)) continue;
          if (!Array.isArray(o.items) || o.items.length === 0) continue;

          const prev = orderMap.get(o.id);
          if (!prev) {
            orderMap.set(o.id, o);
          } else {
            const prevTime = prev.updatedAt ? new Date(prev.updatedAt).getTime() : 0;
            const nextTime = o.updatedAt ? new Date(o.updatedAt).getTime() : 0;
            if (nextTime >= prevTime) {
              orderMap.set(o.id, o);
            }
          }
        }
      };

      if (poRes.ok) ingest(extractArray(await poRes.json()));
      if (psRes.ok) ingest(extractArray(await psRes.json()));

      const serverOrders = Array.from(orderMap.values());

      // 4. Preserve only very recent (<15s) optimistic item status updates still in flight
      if (serverOrders.length > 0) {
        const freshPending = await db.syncQueue
          .where('status')
          .equals('PENDING')
          .filter((m) => Date.now() - m.createdAt < 15_000)
          .toArray()
          .catch(() => []);

        const pendingItemStatusMap = new Map<string, string>();
        const pendingDeliveredItemIds = new Set<string>();

        for (const m of freshPending) {
          if (m.url.includes('/api/v1/pos/order-items/') && m.url.endsWith('/status')) {
            const match = m.url.match(/\/order-items\/([^/]+)\/status/);
            if (match?.[1] && m.payload?.status) {
              pendingItemStatusMap.set(match[1], m.payload.status);
            }
          } else if (m.url.includes('/deliver-all') && Array.isArray(m.payload?.itemIds)) {
            m.payload.itemIds.forEach((id: string) => pendingDeliveredItemIds.add(id));
          }
        }

        if (pendingItemStatusMap.size > 0 || pendingDeliveredItemIds.size > 0) {
          for (const order of serverOrders) {
            if (Array.isArray(order.items)) {
              for (const it of order.items) {
                if (pendingDeliveredItemIds.has(it.id)) {
                  it.status = 'SERVED';
                } else if (pendingItemStatusMap.has(it.id)) {
                  it.status = pendingItemStatusMap.get(it.id);
                }
              }
            }
          }
        }
      }

      // 5. Reconcile local Dexie posOrders cleanly (delete settled/absent orders FIRST, then bulkPut active ones)
      const bothEndpointsSucceeded = poRes.ok && psRes.ok;
      const serverActiveIds = new Set(serverOrders.map((o: any) => o.id));
      const localOrders = await db.posOrders.toArray();
      const idsToDelete: string[] = [];

      for (const lo of localOrders) {
        const shouldRemove =
          isRecentlySettled(lo.id) ||
          ['PAID', 'BILLED_TO_ROOM', 'CANCELLED'].includes(lo.status) ||
          !Array.isArray(lo.items) ||
          lo.items.length === 0 ||
          (bothEndpointsSucceeded && !serverActiveIds.has(lo.id));

        if (shouldRemove) {
          idsToDelete.push(lo.id);
        }
      }

      if (idsToDelete.length > 0) {
        await db.posOrders.bulkDelete(idsToDelete);
        const deletedCheckoutUrls = new Set(
          idsToDelete.map((id) => `/api/v1/pos/orders/${id}/checkout`)
        );
        const obsoleteCheckouts = await db.syncQueue
          .filter((m) => deletedCheckoutUrls.has(m.url))
          .toArray()
          .catch(() => []);
        for (const item of obsoleteCheckouts) {
          if (item.id !== undefined) {
            await db.syncQueue.delete(item.id).catch(() => {});
          }
        }
      }

      if (serverOrders.length > 0) {
        await db.posOrders.bulkPut(serverOrders);
      }
    } catch (err) {
      console.error('POS order sync error:', err);
    } finally {
      posSyncInFlight = null;
    }
  })();

  return posSyncInFlight;
}

// Fetch latest data from server across all HMS modules with fault-isolated sections
export async function downloadLatestData() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  // Always flush pending mutations and sync POS orders with highest priority
  await syncPosOrders();

  // 1. POS Catalog (Tables, Categories, Menu Items)
  try {
    const [ptRes, pcRes, pmRes] = await Promise.all([
      fetchWithAuth('/api/v1/pos/tables'),
      fetchWithAuth('/api/v1/pos/categories'),
      fetchWithAuth('/api/v1/pos/menu-items?limit=1000'),
    ]);

    if (ptRes.ok) {
      const serverTables = extractArray(await ptRes.json());
      const serverIds = new Set(serverTables.map((t: any) => t.id));
      const localTables = await db.posTables.toArray();
      const stale = localTables.filter((lt) => !serverIds.has(lt.id)).map((lt) => lt.id);
      if (stale.length > 0) await db.posTables.bulkDelete(stale);
      if (serverTables.length > 0) await db.posTables.bulkPut(serverTables);
    }

    if (pcRes.ok) {
      const serverCats = extractArray(await pcRes.json());
      const serverIds = new Set(serverCats.map((c: any) => c.id));
      const localCats = await db.posCategories.toArray();
      const stale = localCats.filter((lc) => !serverIds.has(lc.id)).map((lc) => lc.id);
      if (stale.length > 0) await db.posCategories.bulkDelete(stale);
      if (serverCats.length > 0) await db.posCategories.bulkPut(serverCats);
    }

    if (pmRes.ok) {
      const serverItems = extractArray(await pmRes.json());
      const serverIds = new Set(serverItems.map((m: any) => m.id));
      const localItems = await db.posMenuItems.toArray();
      const stale = localItems.filter((li) => !serverIds.has(li.id)).map((li) => li.id);
      if (stale.length > 0) await db.posMenuItems.bulkDelete(stale);
      if (serverItems.length > 0) await db.posMenuItems.bulkPut(serverItems);
    }
  } catch (err) {
    console.error('POS catalog sync failed:', err);
  }

  // 2. Rooms, Room Types, Reservations, Guests, Folios
  try {
    const [roomsRes, roomTypesRes, resRes, guestRes, foliosRes] = await Promise.all([
      fetchWithAuth('/api/v1/rooms'),
      fetchWithAuth('/api/v1/room-types'),
      fetchWithAuth('/api/v1/reservations?limit=200'),
      fetchWithAuth('/api/v1/guests?limit=1000'),
      fetchWithAuth('/api/v1/folios?status=OPEN'),
    ]);

    if (roomsRes.ok) {
      const data = await roomsRes.json();
      const serverRooms = extractArray(data);
      if (serverRooms.length > 0 || (data.data && Array.isArray(data.data))) {
        const serverIds = new Set(serverRooms.map((r: any) => r.id));
        const localRooms = await db.rooms.toArray();
        const stale = localRooms.filter((lr) => !serverIds.has(lr.id)).map((lr) => lr.id);
        if (stale.length > 0) await db.rooms.bulkDelete(stale);
        if (serverRooms.length > 0) await db.rooms.bulkPut(serverRooms);
      }
    }

    if (roomTypesRes.ok) {
      const serverRoomTypes = extractArray(await roomTypesRes.json());
      const serverIds = new Set(serverRoomTypes.map((rt: any) => rt.id));
      const localRoomTypes = await db.roomTypes.toArray();
      const stale = localRoomTypes.filter((lrt) => !serverIds.has(lrt.id)).map((lrt) => lrt.id);
      if (stale.length > 0) await db.roomTypes.bulkDelete(stale);
      if (serverRoomTypes.length > 0) await db.roomTypes.bulkPut(serverRoomTypes);
    }

    if (resRes.ok) {
      const serverRes = extractArray(await resRes.json());
      if (serverRes.length > 0) await db.reservations.bulkPut(serverRes);
    }

    if (guestRes.ok) {
      const serverGuests = extractArray(await guestRes.json());
      if (serverGuests.length > 0) await db.guests.bulkPut(serverGuests);
    }

    if (foliosRes.ok) {
      const folios = extractArray(await foliosRes.json());
      const serverIds = new Set(folios.map((f: any) => f.id));
      const localFolios = await db.folios.toArray();
      const toDelete = localFolios.filter((f: any) => !serverIds.has(f.id)).map((f: any) => f.id);
      if (toDelete.length > 0) await db.folios.bulkDelete(toDelete);
      if (folios.length > 0) await db.folios.bulkPut(folios);
    }
  } catch (err) {
    console.error('PMS data sync failed:', err);
  }

  // 3. Property, Inventory, Taxes, Work Orders, Events, Companies, Expenses
  try {
    const [propsRes, invRes, taxRes, woRes, spacesRes, bookingsRes, compRes, expRes] = await Promise.all([
      fetchWithAuth('/api/v1/properties'),
      fetchWithAuth('/api/v1/inventory?limit=1000'),
      fetchWithAuth('/api/v1/taxes'),
      fetchWithAuth('/api/v1/work-orders'),
      fetchWithAuth('/api/v1/events/spaces'),
      fetchWithAuth('/api/v1/events/bookings'),
      fetchWithAuth('/api/v1/companies'),
      fetchWithAuth('/api/v1/expenses'),
    ]);

    if (propsRes.ok) {
      const d = await propsRes.json();
      const prop = d.data || d;
      if (prop && prop.id) await db.properties.put(prop);
    }

    if (invRes.ok) {
      const d = await invRes.json();
      const serverItems = extractArray(d);
      if (serverItems.length > 0 || (d.data && Array.isArray(d.data))) {
        const serverIds = new Set(serverItems.map((i: any) => i.id));
        const localItems = await db.inventory.toArray();
        const stale = localItems.filter((li) => !serverIds.has(li.id)).map((li) => li.id);
        if (stale.length > 0) await db.inventory.bulkDelete(stale);
        if (serverItems.length > 0) await db.inventory.bulkPut(serverItems);
      }
    }

    if (taxRes.ok) {
      const taxes = extractArray(await taxRes.json());
      if (taxes.length > 0) await db.taxes.bulkPut(taxes);
    }

    if (woRes.ok) {
      const orders = extractArray(await woRes.json());
      if (orders.length > 0) await db.workOrders.bulkPut(orders);
    }

    if (spacesRes.ok) {
      const spaces = extractArray(await spacesRes.json());
      const serverIds = new Set(spaces.map((s: any) => s.id));
      const localSpaces = await db.eventSpaces.toArray();
      const stale = localSpaces.filter((ls) => !serverIds.has(ls.id)).map((ls) => ls.id);
      if (stale.length > 0) await db.eventSpaces.bulkDelete(stale);
      if (spaces.length > 0) await db.eventSpaces.bulkPut(spaces);
    }

    if (bookingsRes.ok) {
      const bookings = extractArray(await bookingsRes.json());
      const serverIds = new Set(bookings.map((b: any) => b.id));
      const localBookings = await db.eventBookings.toArray();
      const stale = localBookings.filter((lb) => !serverIds.has(lb.id)).map((lb) => lb.id);
      if (stale.length > 0) await db.eventBookings.bulkDelete(stale);
      if (bookings.length > 0) await db.eventBookings.bulkPut(bookings);
    }

    if (compRes.ok) {
      const comps = extractArray(await compRes.json());
      if (comps.length > 0) await db.companies.bulkPut(comps);
    }

    if (expRes.ok) {
      const exps = extractArray(await expRes.json());
      if (exps.length > 0) await db.expenses.bulkPut(exps);
    }
  } catch (err) {
    console.error('Secondary module sync failed:', err);
  }
}

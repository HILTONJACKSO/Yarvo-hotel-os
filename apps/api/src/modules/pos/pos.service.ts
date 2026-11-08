import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class PosService {
  // Idempotency & duplicate-click burst guards to prevent doubled Kitchen/Bar orders
  private recentClientRequests = new Map<string, { promise: Promise<any>; expiresAt: number }>();
  private recentOrderBatchBursts = new Map<string, { promise: Promise<any>; expiresAt: number }>();
  private recentItemBursts = new Map<string, { promise: Promise<any>; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  private pruneDedupeMap(map: Map<string, { promise: Promise<any>; expiresAt: number }>) {
    const now = Date.now();
    for (const [k, v] of map.entries()) {
      if (v.expiresAt <= now) {
        map.delete(k);
      }
    }
  }

  // ─── TABLES ─────────────────────────────────────────────────────────────
  async getTables(propertyId?: string) {
    const tables = await this.prisma.posTable.findMany({
      where: propertyId ? { propertyId } : {},
    });
    return tables.sort((a, b) => {
      const numA = parseInt(a.number.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.number.replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return a.number.localeCompare(b.number);
    });
  }

  async createTable(data: { number: string; capacity: number }, propertyId?: string) {
    return this.prisma.posTable.create({
      data: {
        ...data,
        ...(propertyId ? { propertyId } : {}),
      },
    });
  }

  async deleteTable(id: string) {
    return this.prisma.posTable.delete({ where: { id } });
  }

  // ─── MENU ─────────────────────────────────────────────────────────────
  async getCategories(propertyId?: string) {
    return this.prisma.posCategory.findMany({
      where: propertyId ? { propertyId } : {},
      include: { items: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data: { name: string }, propertyId?: string) {
    return this.prisma.posCategory.create({
      data: {
        ...data,
        ...(propertyId ? { propertyId } : {}),
      },
    });
  }

  async updateCategory(id: string, data: { name: string }, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldRecord = await tx.posCategory.findUnique({ where: { id } });
      const newRecord = await tx.posCategory.update({
        where: { id },
        data
      });
      if (oldRecord) {
        await this.auditLogsService.logAction({
          userId,
          action: 'EDIT_POS_CATEGORY',
          entity: 'PosCategory',
          entityId: id,
          oldValues: oldRecord,
          newValues: newRecord
        });
      }
      return newRecord;
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const items = await tx.posMenuItem.findMany({ where: { categoryId: id } });
      for (const item of items) {
        await tx.inventoryRecipe.deleteMany({ where: { menuItemId: item.id } });
      }
      await tx.posMenuItem.deleteMany({ where: { categoryId: id } });
      return tx.posCategory.delete({ where: { id } });
    });
  }

  async getMenuItems(propertyId?: string) {
    return this.prisma.posMenuItem.findMany({
      where: propertyId ? { category: { propertyId } } : {},
      include: { category: true, recipes: true, taxes: true },
      orderBy: { name: 'asc' },
    });
  }

  async createMenuItem(data: { categoryId: string; name: string; description?: string; price: number; type?: string; inventoryItemId?: string; image?: string; images?: string[]; taxIds?: string[] }) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.posMenuItem.create({ 
        data: {
          categoryId: data.categoryId,
          name: data.name,
          description: data.description,
          price: data.price,
          type: data.type || 'FOOD',
          image: data.image,
          images: data.images || [],
          taxes: data.taxIds ? {
            connect: data.taxIds.map(id => ({ id }))
          } : undefined
        }
      });

      if (data.inventoryItemId) {
        await tx.inventoryRecipe.create({
          data: {
            menuItemId: item.id,
            inventoryItemId: data.inventoryItemId,
            quantity: 1
          }
        });
      }

      return item;
    });
  }

  async updateMenuItem(id: string, data: { categoryId?: string; name?: string; description?: string; price?: number; type?: string; inventoryItemId?: string; image?: string; images?: string[]; taxIds?: string[] }, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldRecord = await tx.posMenuItem.findUnique({ where: { id }, include: { taxes: true } });
      // First update the core fields
      const item = await tx.posMenuItem.update({
        where: { id },
        data: {
          categoryId: data.categoryId,
          name: data.name,
          description: data.description,
          price: data.price,
          type: data.type,
          image: data.image,
          images: data.images,
          taxes: data.taxIds ? {
            set: data.taxIds.map(taxId => ({ id: taxId }))
          } : undefined
        }
      });

      // Handle recipe updates if inventoryItemId is provided
      if (data.inventoryItemId !== undefined) {
        // Remove existing recipes for this item
        await tx.inventoryRecipe.deleteMany({
          where: { menuItemId: id }
        });

        // Add new recipe if not empty
        if (data.inventoryItemId) {
          await tx.inventoryRecipe.create({
            data: {
              menuItemId: id,
              inventoryItemId: data.inventoryItemId,
              quantity: 1
            }
          });
        }
      }

      if (oldRecord) {
        await this.auditLogsService.logAction({
          userId,
          action: 'EDIT_POS_MENU_ITEM',
          entity: 'PosMenuItem',
          entityId: id,
          oldValues: oldRecord,
          newValues: item
        });
      }

      return item;
    });
  }

  async deleteMenuItem(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.inventoryRecipe.deleteMany({ where: { menuItemId: id } });
      return tx.posMenuItem.delete({ where: { id } });
    });
  }

  // ─── ORDERS ─────────────────────────────────────────────────────────────
  async getDailyDepartmentStats(type: 'FOOD' | 'DRINK', propertyId?: string) {
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const startOfDay = new Date(Math.min(localMidnight.getTime(), utcMidnight.getTime()));

    const orders = await this.prisma.posOrder.findMany({
      where: {
        createdAt: { gte: startOfDay },
        status: { not: 'CANCELLED' },
        ...(propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {}),
      },
      include: {
        items: {
          include: {
            menuItem: true,
            returnRequest: true
          }
        }
      }
    });

    let totalOrders = 0;
    let totalRevenue = 0;

    for (const order of orders) {
      // 1. Filter out all cancelled, returned, or return-requested items
      const activeItems = (order.items || []).filter(item => {
        if (['CANCELLED', 'RETURNED', 'RETURN_REQUESTED'].includes(item.status)) return false;
        if (item.returnRequest && item.returnRequest.status !== 'REJECTED') return false;
        return true;
      });

      if (activeItems.length === 0) continue;

      // 2. Order gross across all active items
      const orderGross = activeItems.reduce((sum, item) => sum + (Number(item.menuItem?.price || 0) * item.quantity), 0);
      if (orderGross <= 0) continue;

      // 3. Department active items
      const deptItems = activeItems.filter(item => {
        const itemType = item.menuItem?.type;
        return type === 'FOOD' ? itemType === 'FOOD' : (itemType === 'DRINK' || itemType === 'BAR');
      });

      if (deptItems.length === 0) continue;

      const deptGross = deptItems.reduce((sum, item) => sum + (Number(item.menuItem?.price || 0) * item.quantity), 0);
      const deptCount = deptItems.reduce((sum, item) => sum + item.quantity, 0);

      // 4. Proportional discount deduction (so discounts never increase department revenue)
      const orderDiscount = Number(order.discountAmount || 0);
      const allocatedDiscount = Math.min(deptGross, orderDiscount * (deptGross / orderGross));
      const deptNet = Math.max(0, deptGross - allocatedDiscount);

      totalOrders += deptCount;
      totalRevenue += deptNet;
    }

    return { totalOrders, totalRevenue: Number(totalRevenue.toFixed(2)) };
  }

  async getDailyWaitstaffStats(userId: string) {
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const today = new Date(Math.min(localMidnight.getTime(), utcMidnight.getTime()));

    const orders = await this.prisma.posOrder.findMany({
      where: {
        createdAt: { gte: today },
        userId,
        status: { not: 'CANCELLED' }
      },
      include: {
        items: {
          include: {
            menuItem: true,
            returnRequest: true
          }
        }
      }
    });

    let totalOrders = 0;
    let totalRevenue = 0;

    for (const order of orders) {
      const activeItems = (order.items || []).filter(item => {
        if (['CANCELLED', 'RETURNED', 'RETURN_REQUESTED'].includes(item.status)) return false;
        if (item.returnRequest && item.returnRequest.status !== 'REJECTED') return false;
        return true;
      });

      if (activeItems.length === 0) continue;

      const orderGross = activeItems.reduce((sum, item) => sum + (Number(item.menuItem?.price || 0) * item.quantity), 0);
      if (orderGross <= 0) continue;

      const orderDiscount = Number(order.discountAmount || 0);
      const netRevenue = Math.max(0, orderGross - orderDiscount);

      totalOrders += activeItems.reduce((sum, item) => sum + item.quantity, 0);
      totalRevenue += netRevenue;
    }

    return { totalOrders, totalRevenue: Number(totalRevenue.toFixed(2)) };
  }

  async getDailyCashierStats(propertyId?: string) {
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const startOfDay = new Date(Math.min(localMidnight.getTime(), utcMidnight.getTime()));

    const propertyFilter = propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {};

    // Get all orders settled today (PAID or BILLED_TO_ROOM)
    const settledOrders = await this.prisma.posOrder.findMany({
      where: {
        status: { in: ['PAID', 'BILLED_TO_ROOM'] },
        updatedAt: { gte: startOfDay },
        ...propertyFilter,
      },
      include: {
        items: {
          include: {
            menuItem: true,
            returnRequest: true
          }
        }
      }
    });

    let totalRevenue = 0;
    for (const order of settledOrders) {
      const activeItems = (order.items || []).filter(item => {
        if (['CANCELLED', 'RETURNED', 'RETURN_REQUESTED'].includes(item.status)) return false;
        if (item.returnRequest && item.returnRequest.status !== 'REJECTED') return false;
        return true;
      });

      const orderGross = activeItems.reduce((sum, item) => sum + (Number(item.menuItem?.price || 0) * item.quantity), 0);
      const discount = Number(order.discountAmount || 0);
      const netOrderTotal = Math.max(0, orderGross - discount);
      totalRevenue += netOrderTotal;
    }

    return { totalOrders: settledOrders.length, totalRevenue: Number(totalRevenue.toFixed(2)) };
  }

  async getActiveOrders(propertyId?: string) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await this.prisma.posOrder.deleteMany({
      where: {
        status: 'OPEN',
        createdAt: { lt: tenMinutesAgo },
        items: { none: {} },
        payments: { none: {} },
      },
    }).catch(() => {});

    return this.prisma.posOrder.findMany({
      where: {
        AND: [
          ...(propertyId ? [{ OR: [{ propertyId }, { propertyId: null }] }] : []),
          { status: { notIn: ['PAID', 'BILLED_TO_ROOM', 'CANCELLED'] } },
          { items: { some: {} } },
          {
            OR: [
              { status: { notIn: ['SERVED'] } },
              { items: { some: { status: { in: ['PENDING', 'PREPARING', 'COOKING', 'READY', 'RETURN_REQUESTED'] } } } },
            ],
          },
        ],
      },
      include: {
        table: true,
        guest: true,
        user: { select: { firstName: true, lastName: true } },
        folio: { include: { reservation: { include: { room: true, guest: true } } } },
        items: {
          include: { menuItem: true, returnRequest: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReadyOrderItems(propertyId?: string) {
    return this.prisma.posOrderItem.findMany({
      where: {
        status: 'READY',
        order: {
          status: { notIn: ['PAID', 'BILLED_TO_ROOM', 'CANCELLED'] },
          ...(propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {}),
        },
      },
      include: {
        menuItem: true,
        order: { include: { table: true, guest: true, user: { select: { firstName: true, lastName: true } }, folio: { include: { reservation: { include: { room: true } } } } } }
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getServedOrders(propertyId?: string) {
    return this.prisma.posOrder.findMany({
      where: {
        status: { in: ['OPEN', 'SERVED'] },
        items: { some: {} },
        ...(propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {}),
      },
      include: {
        table: true,
        guest: true,
        user: { select: { firstName: true, lastName: true } },
        folio: { include: { reservation: { include: { room: true, guest: true } } } },
        items: { include: { menuItem: true, returnRequest: true } }
      },
      orderBy: { updatedAt: 'asc' }
    });
  }

  async transferItems(data: {
    sourceOrderId: string;
    targetTableId?: string;
    targetOrderId?: string;
    items: { id: string; quantity: number }[];
  }) {
    if (!data.targetTableId && !data.targetOrderId) {
      throw new BadRequestException('Target table or order is required');
    }

    const sourceOrder = await this.prisma.posOrder.findUnique({
      where: { id: data.sourceOrderId },
    });

    let targetOrderId = data.targetOrderId;

    if (!targetOrderId && data.targetTableId) {
      const activeOrder = await this.prisma.posOrder.findFirst({
        where: {
          tableId: data.targetTableId,
          status: { in: ['OPEN', 'PREPARING', 'READY', 'SERVED'] }
        }
      });

      if (activeOrder) {
        targetOrderId = activeOrder.id;
      } else {
        const newOrder = await this.prisma.posOrder.create({
          data: {
            tableId: data.targetTableId,
            status: 'OPEN',
            totalAmount: 0,
            propertyId: sourceOrder?.propertyId || null,
            userId: sourceOrder?.userId || null,
          }
        });
        targetOrderId = newOrder.id;
      }
    }

    if (!targetOrderId) throw new BadRequestException('Target order could not be determined');
    if (targetOrderId === data.sourceOrderId) throw new BadRequestException('Cannot transfer to the same order');

    for (const item of data.items) {
      const orderItem = await this.prisma.posOrderItem.findUnique({
        where: { id: item.id }
      });
      
      if (!orderItem || orderItem.orderId !== data.sourceOrderId) continue;
      
      if (item.quantity >= orderItem.quantity) {
        await this.prisma.posOrderItem.update({
          where: { id: item.id },
          data: { orderId: targetOrderId }
        });
      } else if (item.quantity > 0) {
        await this.prisma.posOrderItem.update({
          where: { id: item.id },
          data: { quantity: orderItem.quantity - item.quantity }
        });
        
        await this.prisma.posOrderItem.create({
          data: {
            orderId: targetOrderId,
            menuItemId: orderItem.menuItemId,
            quantity: item.quantity,
            status: orderItem.status,
            notes: orderItem.notes
          }
        });
      }
    }

    await this.recalculateOrderTotal(data.sourceOrderId);
    await this.recalculateOrderTotal(targetOrderId);

    // Sync target order status if all its items are already served
    const targetItems = await this.prisma.posOrderItem.findMany({ where: { orderId: targetOrderId } });
    if (targetItems.length > 0) {
      const allTargetServed = targetItems.every(i => ['SERVED', 'DELIVERED', 'RETURNED', 'CANCELLED'].includes(i.status));
      await this.prisma.posOrder.update({
        where: { id: targetOrderId },
        data: { status: allTargetServed ? 'SERVED' : 'OPEN' },
      });
    }
    
    const sourceItemsCount = await this.prisma.posOrderItem.count({ where: { orderId: data.sourceOrderId } });
    const sourcePaymentsCount = await this.prisma.posPayment.count({ where: { orderId: data.sourceOrderId } });
    if (sourceItemsCount === 0 && sourcePaymentsCount === 0) {
      await this.prisma.posOrder.delete({ where: { id: data.sourceOrderId } });
    }

    return { success: true };
  }

  async recalculateOrderTotal(orderId: string) {
    const order = await this.prisma.posOrder.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } } }
    });
    if (!order) return;

    let subtotal = 0;
    order.items.forEach(i => {
      if (i.status !== 'RETURNED' && i.status !== 'RETURN_REQUESTED') {
        subtotal += Number(i.menuItem.price) * i.quantity;
      }
    });

    const finalTotal = Math.max(0, subtotal - Number(order.discountAmount || 0));
    await this.prisma.posOrder.update({
      where: { id: orderId },
      data: { totalAmount: finalTotal }
    });
  }

  async createOrder(data: {
    tableId?: string;
    folioId?: string;
    guestId?: string;
    userId?: string;
    userRoles?: string[];
    discountAmount?: number;
    discountReason?: string;
    notes?: string;
    propertyId?: string;
    clientRequestId?: string;
    items?: Array<{ menuItemId: string; quantity: number; notes?: string }>;
  }) {
    this.pruneDedupeMap(this.recentClientRequests);
    this.pruneDedupeMap(this.recentOrderBatchBursts);

    if (data.clientRequestId) {
      const existingReq = this.recentClientRequests.get(data.clientRequestId);
      if (existingReq) {
        return existingReq.promise;
      }
    }

    let batchKey: string | null = null;
    if (Array.isArray(data.items) && data.items.length > 0) {
      const destKey = data.tableId
        ? `T:${data.tableId}`
        : data.folioId
          ? `F:${data.folioId}`
          : data.guestId
            ? `G:${data.guestId}`
            : `U:${data.userId || 'walkin'}`;
      const itemsSig = [...data.items]
        .map((i) => `${i.menuItemId}:${Number(i.quantity)}:${(i.notes || '').trim()}`)
        .sort()
        .join('|');
      batchKey = `${destKey}::${itemsSig}`;

      const existingBurst = this.recentOrderBatchBursts.get(batchKey);
      if (existingBurst) {
        return existingBurst.promise;
      }
    }

    const executionPromise = this.executeCreateOrder(data).catch((err) => {
      if (data.clientRequestId) {
        this.recentClientRequests.delete(data.clientRequestId);
      }
      if (batchKey) {
        this.recentOrderBatchBursts.delete(batchKey);
      }
      throw err;
    });

    if (data.clientRequestId) {
      this.recentClientRequests.set(data.clientRequestId, {
        promise: executionPromise,
        expiresAt: Date.now() + 120_000,
      });
    }
    if (batchKey) {
      this.recentOrderBatchBursts.set(batchKey, {
        promise: executionPromise,
        expiresAt: Date.now() + 2_500,
      });
    }

    return executionPromise;
  }

  private async executeCreateOrder(data: {
    tableId?: string;
    folioId?: string;
    guestId?: string;
    userId?: string;
    userRoles?: string[];
    discountAmount?: number;
    discountReason?: string;
    notes?: string;
    propertyId?: string;
    items?: Array<{ menuItemId: string; quantity: number; notes?: string }>;
  }) {
    const rawItems = Array.isArray(data.items)
      ? data.items.filter((i) => i && i.menuItemId && Number(i.quantity) > 0)
      : [];

    // Consolidate any duplicate menuItemId + notes lines within the same payload
    const consolidatedMap = new Map<string, { menuItemId: string; quantity: number; notes?: string }>();
    for (const entry of rawItems) {
      const key = `${entry.menuItemId}::${(entry.notes || '').trim()}`;
      const prev = consolidatedMap.get(key);
      if (prev) {
        prev.quantity += Number(entry.quantity);
      } else {
        consolidatedMap.set(key, {
          menuItemId: entry.menuItemId,
          quantity: Number(entry.quantity),
          notes: entry.notes,
        });
      }
    }
    const itemsToCreate = Array.from(consolidatedMap.values());

    // Legacy flow when no items array is passed in createOrder
    if (itemsToCreate.length === 0) {
      const existing = await this.findExistingOpenOrder(this.prisma, data);
      if (existing) {
        this.assertCanEditPrintedOrder(existing, data.userRoles);
        if (data.discountAmount !== undefined || data.notes !== undefined) {
          return this.prisma.posOrder.update({
            where: { id: existing.id },
            data: {
              ...(data.discountAmount !== undefined ? { discountAmount: data.discountAmount } : {}),
              ...(data.discountReason !== undefined ? { discountReason: data.discountReason } : {}),
              ...(data.notes !== undefined ? { notes: data.notes } : {}),
            },
          });
        }
        return existing;
      }

      return this.prisma.posOrder.create({
        data: {
          tableId: data.tableId,
          folioId: data.folioId,
          guestId: data.guestId,
          userId: data.userId,
          status: 'OPEN',
          discountAmount: data.discountAmount || 0,
          discountReason: data.discountReason,
          notes: data.notes,
          ...(data.propertyId ? { propertyId: data.propertyId } : {}),
        },
      });
    }

    // Atomic flow: validate stock for ALL items, find/create order, add items, deduct stock, recalculate total
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.findExistingOpenOrder(tx, data);
      if (existing) {
        this.assertCanEditPrintedOrder(existing, data.userRoles);
      }

      const uniqueMenuItemIds = Array.from(new Set(itemsToCreate.map((i) => i.menuItemId)));
      const menuItems = await tx.posMenuItem.findMany({
        where: { id: { in: uniqueMenuItemIds } },
      });
      const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

      for (const reqItem of itemsToCreate) {
        if (!menuItemMap.has(reqItem.menuItemId)) {
          throw new BadRequestException('Selected menu item no longer exists');
        }
      }

      const recipes = await tx.inventoryRecipe.findMany({
        where: { menuItemId: { in: uniqueMenuItemIds } },
      });

      // Aggregate inventory demand across the entire cart so multi-item stock checks are 100% accurate
      const demandByInvId = new Map<
        string,
        { stockKitchen: number; stockBar: number; stockMain: number; deptLabel: string }
      >();

      for (const reqItem of itemsToCreate) {
        const menuItem = menuItemMap.get(reqItem.menuItemId)!;
        let primaryField: 'stockKitchen' | 'stockBar' | 'stockMain' = 'stockMain';
        let deptLabel = 'Main';
        if (menuItem.type === 'DRINK' || menuItem.type === 'BAR') {
          primaryField = 'stockBar';
          deptLabel = 'Bar';
        } else if (menuItem.type === 'FOOD') {
          primaryField = 'stockKitchen';
          deptLabel = 'Kitchen';
        }

        const itemRecipes = recipes.filter((r) => r.menuItemId === reqItem.menuItemId);
        for (const r of itemRecipes) {
          const needed = Number(r.quantity) * Number(reqItem.quantity);
          if (needed <= 0) continue;
          const prev = demandByInvId.get(r.inventoryItemId) || {
            stockKitchen: 0,
            stockBar: 0,
            stockMain: 0,
            deptLabel,
          };
          prev[primaryField] += needed;
          prev.deptLabel = deptLabel;
          demandByInvId.set(r.inventoryItemId, prev);
        }
      }

      const inventoryUpdates: Array<{ invId: string; updateData: any }> = [];
      if (demandByInvId.size > 0) {
        const invItems = await tx.inventoryItem.findMany({
          where: { id: { in: Array.from(demandByInvId.keys()) } },
        });
        const invMap = new Map(invItems.map((inv) => [inv.id, inv]));

        for (const [invId, demand] of demandByInvId.entries()) {
          const invItem = invMap.get(invId);
          if (!invItem) continue;

          const totalDeduction = demand.stockKitchen + demand.stockBar + demand.stockMain;
          const totalStock = Number(invItem.stockLevel || 0);
          const curKitchen = Number(invItem.stockKitchen || 0);
          const curBar = Number(invItem.stockBar || 0);
          const curMain = Number(invItem.stockMain || 0);
          const otherAllocated =
            curKitchen +
            curBar +
            Number(invItem.stockHousekeeping || 0) +
            Number(invItem.stockBoutique || 0);
          const unallocatedMain = Math.max(0, totalStock - otherAllocated);
          const effectiveMain = Math.max(curMain, unallocatedMain);

          const deductKitchen = Math.min(curKitchen, demand.stockKitchen);
          const overflowKitchen = demand.stockKitchen - deductKitchen;

          const deductBar = Math.min(curBar, demand.stockBar);
          const overflowBar = demand.stockBar - deductBar;

          const deductMain = demand.stockMain + overflowKitchen + overflowBar;
          const totalDeptAvailable =
            (demand.stockKitchen > 0 ? curKitchen : 0) +
            (demand.stockBar > 0 ? curBar : 0) +
            effectiveMain;

          if (deductMain > effectiveMain && totalStock < totalDeduction) {
            const primaryAvail = demand.stockBar > 0 ? curBar : curKitchen;
            if (demand.stockKitchen > 0 || demand.stockBar > 0) {
              throw new BadRequestException(
                `Not enough stock for "${invItem.name}". Available: ${Math.max(totalDeptAvailable, totalStock)} ${invItem.unit} (${primaryAvail} in ${demand.deptLabel}, ${effectiveMain} in Main), Requested: ${totalDeduction} ${invItem.unit}`,
              );
            }
            throw new BadRequestException(
              `Not enough stock for "${invItem.name}". Available: ${Math.max(totalStock, effectiveMain)} ${invItem.unit}, Requested: ${totalDeduction} ${invItem.unit}`,
            );
          }

          if (totalStock < totalDeduction && totalDeptAvailable < totalDeduction) {
            throw new BadRequestException(
              `Not enough stock for "${invItem.name}". Available: ${Math.max(totalStock, effectiveMain)} ${invItem.unit}, Requested: ${totalDeduction} ${invItem.unit}`,
            );
          }

          const updateData: any = {
            stockLevel: { decrement: totalDeduction },
          };
          if (deductKitchen > 0) {
            updateData.stockKitchen = { decrement: deductKitchen };
          }
          if (deductBar > 0) {
            updateData.stockBar = { decrement: deductBar };
          }
          if (deductMain > 0) {
            if (curMain >= deductMain) {
              updateData.stockMain = { decrement: deductMain };
            } else {
              const remainingTotal = Math.max(0, totalStock - totalDeduction);
              const otherRemaining = otherAllocated - deductKitchen - deductBar;
              updateData.stockMain = Math.max(0, remainingTotal - otherRemaining);
            }
          }

          inventoryUpdates.push({ invId, updateData });
        }
      }

      // Safe to find/update or create the order now that all stock checks passed
      let targetOrder = existing;
      if (targetOrder) {
        targetOrder = await tx.posOrder.update({
          where: { id: targetOrder.id },
          data: {
            status: 'OPEN',
            ...(data.discountAmount !== undefined ? { discountAmount: data.discountAmount } : {}),
            ...(data.discountReason !== undefined ? { discountReason: data.discountReason } : {}),
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
          },
        });
      } else {
        targetOrder = await tx.posOrder.create({
          data: {
            tableId: data.tableId,
            folioId: data.folioId,
            guestId: data.guestId,
            userId: data.userId,
            status: 'OPEN',
            discountAmount: data.discountAmount || 0,
            discountReason: data.discountReason,
            notes: data.notes,
            ...(data.propertyId ? { propertyId: data.propertyId } : {}),
          },
        });
      }

      const itemPropertyId = targetOrder.propertyId || data.propertyId || null;
      for (const reqItem of itemsToCreate) {
        await tx.posOrderItem.create({
          data: {
            orderId: targetOrder.id,
            menuItemId: reqItem.menuItemId,
            quantity: reqItem.quantity,
            notes: reqItem.notes,
            status: 'PENDING',
            propertyId: itemPropertyId,
          },
        });
      }

      for (const u of inventoryUpdates) {
        await tx.inventoryItem.update({
          where: { id: u.invId },
          data: u.updateData,
        });
      }

      const allOrderItems = await tx.posOrderItem.findMany({
        where: { orderId: targetOrder.id },
        include: { menuItem: true },
      });

      let subtotal = 0;
      for (const i of allOrderItems) {
        if (i.status !== 'RETURNED' && i.status !== 'RETURN_REQUESTED') {
          subtotal += Number(i.menuItem.price) * i.quantity;
        }
      }
      const finalTotal = Math.max(0, subtotal - Number(targetOrder.discountAmount || 0));

      return tx.posOrder.update({
        where: { id: targetOrder.id },
        data: { totalAmount: finalTotal, status: 'OPEN' },
        include: {
          table: true,
          guest: true,
          user: { select: { firstName: true, lastName: true } },
          folio: { include: { reservation: { include: { room: true, guest: true } } } },
          items: { include: { menuItem: true, returnRequest: true } },
        },
      });
    });
  }

  private async findExistingOpenOrder(
    client: Pick<PrismaService, 'posOrder'>,
    data: { tableId?: string; folioId?: string; guestId?: string; propertyId?: string },
  ) {
    if (data.tableId) {
      return client.posOrder.findFirst({
        where: {
          tableId: data.tableId,
          status: { in: ['OPEN', 'SERVED'] },
          ...(data.propertyId ? { propertyId: data.propertyId } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (data.folioId) {
      return client.posOrder.findFirst({
        where: { folioId: data.folioId, status: { in: ['OPEN', 'SERVED'] } },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (data.guestId) {
      return client.posOrder.findFirst({
        where: { guestId: data.guestId, status: { in: ['OPEN', 'SERVED'] } },
        orderBy: { createdAt: 'desc' },
      });
    }
    return null;
  }

  private assertCanEditPrintedOrder(existing: { invoicePrintCount: number }, userRoles?: string[]) {
    if (existing.invoicePrintCount > 0) {
      const normalizedRoles = (userRoles || []).map((r: any) =>
        (typeof r === 'string' ? r : r?.name || '').toUpperCase(),
      );
      const isAdmin = normalizedRoles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r));
      if (!isAdmin) {
        throw new ForbiddenException(
          'Invoice has already been printed. Only Admin or CEO can edit this bill.',
        );
      }
    }
  }

  async addOrderItem(
    orderId: string,
    data: { menuItemId: string; quantity: number; notes?: string; clientRequestId?: string },
  ) {
    this.pruneDedupeMap(this.recentClientRequests);
    this.pruneDedupeMap(this.recentItemBursts);

    if (data.clientRequestId) {
      const existingReq = this.recentClientRequests.get(data.clientRequestId);
      if (existingReq) {
        return existingReq.promise;
      }
    }

    const burstKey = `${orderId}:${data.menuItemId}:${Number(data.quantity)}:${(data.notes || '').trim()}`;
    if (!data.clientRequestId) {
      const existingBurst = this.recentItemBursts.get(burstKey);
      if (existingBurst) {
        return existingBurst.promise;
      }
    }

    const executionPromise = this.executeAddOrderItem(orderId, data).catch((err) => {
      if (data.clientRequestId) {
        this.recentClientRequests.delete(data.clientRequestId);
      }
      this.recentItemBursts.delete(burstKey);
      throw err;
    });

    if (data.clientRequestId) {
      this.recentClientRequests.set(data.clientRequestId, {
        promise: executionPromise,
        expiresAt: Date.now() + 120_000,
      });
    } else {
      this.recentItemBursts.set(burstKey, {
        promise: executionPromise,
        expiresAt: Date.now() + 3_000,
      });
    }

    return executionPromise;
  }

  private async executeAddOrderItem(
    orderId: string,
    data: { menuItemId: string; quantity: number; notes?: string },
  ) {
    // Fetch menu item to determine type (FOOD -> Kitchen, DRINK -> Bar)
    const menuItem = await this.prisma.posMenuItem.findUnique({
      where: { id: data.menuItemId }
    });

    let primaryField = 'stockMain';
    let deptName = 'Main';
    if (menuItem?.type === 'DRINK' || menuItem?.type === 'BAR') {
      primaryField = 'stockBar';
      deptName = 'Bar';
    } else if (menuItem?.type === 'FOOD') {
      primaryField = 'stockKitchen';
      deptName = 'Kitchen';
    }

    // Verify stock before creating order item
    const recipes = await this.prisma.inventoryRecipe.findMany({
      where: { menuItemId: data.menuItemId }
    });
    
    // Check stock for all recipe items
    const deductionPlans: Array<{
      recipe: typeof recipes[0];
      invItem: any;
      deductFromPrimary: number;
      deductFromMain: number;
      totalDeduction: number;
    }> = [];

    for (const recipe of recipes) {
      const deductionAmount = Number(recipe.quantity) * Number(data.quantity);
      const invItem = await this.prisma.inventoryItem.findUnique({
        where: { id: recipe.inventoryItemId }
      });

      if (invItem) {
        const totalStock = Number(invItem.stockLevel || 0);
        const primaryStock = Number((invItem as any)[primaryField] || 0);
        const currentMain = Number(invItem.stockMain || 0);
        
        // Calculate unallocated main stock if stockMain desynced
        const otherAllocated = 
          Number(invItem.stockKitchen || 0) + 
          Number(invItem.stockBar || 0) + 
          Number(invItem.stockHousekeeping || 0) + 
          Number(invItem.stockBoutique || 0);
        const unallocatedMain = Math.max(0, totalStock - otherAllocated);
        const effectiveMain = Math.max(currentMain, unallocatedMain);

        let deductFromPrimary = 0;
        let deductFromMain = 0;

        if (primaryField === 'stockMain') {
          // General item - check main & total available
          const totalAvailable = Math.max(totalStock, effectiveMain);
          if (totalAvailable < deductionAmount) {
            throw new BadRequestException(
              `Not enough stock for "${invItem.name}". Available: ${totalAvailable} ${invItem.unit}, Requested: ${deductionAmount} ${invItem.unit}`
            );
          }
          deductFromMain = deductionAmount;
        } else {
          // Departmental item (e.g. Bar or Kitchen)
          const totalAvailable = primaryStock + effectiveMain;
          if (totalAvailable < deductionAmount && totalStock < deductionAmount) {
            throw new BadRequestException(
              `Not enough stock for "${invItem.name}". Available: ${Math.max(totalAvailable, totalStock)} ${invItem.unit} (${primaryStock} in ${deptName}, ${effectiveMain} in Main), Requested: ${deductionAmount} ${invItem.unit}`
            );
          }

          if (primaryStock >= deductionAmount) {
            // Full amount satisfied by the department (e.g. Bar)
            deductFromPrimary = deductionAmount;
          } else {
            // Take what is available in primary department, and rest from Main storage
            deductFromPrimary = primaryStock;
            deductFromMain = deductionAmount - primaryStock;
          }
        }

        deductionPlans.push({
          recipe,
          invItem,
          deductFromPrimary,
          deductFromMain,
          totalDeduction: deductionAmount
        });
      }
    }

    // Now safe to create order item
    const item = await this.prisma.posOrderItem.create({
      data: {
        orderId,
        menuItemId: data.menuItemId,
        quantity: data.quantity,
        notes: data.notes,
        status: 'PENDING',
      },
    });

    // Recalculate total amount
    await this.recalculateOrderTotal(orderId);

    // Revert the order back to OPEN if it was SERVED
    await this.prisma.posOrder.updateMany({
      where: { id: orderId, status: 'SERVED' },
      data: { status: 'OPEN' }
    });
    
    // Execute deduction plans
    for (const plan of deductionPlans) {
      const inv = plan.invItem;
      const updateData: any = {
        stockLevel: { decrement: plan.totalDeduction }
      };

      if (plan.deductFromPrimary > 0 && primaryField !== 'stockMain') {
        updateData[primaryField] = { decrement: plan.deductFromPrimary };
      }

      if (plan.deductFromMain > 0) {
        const currentMain = Number(inv.stockMain || 0);
        if (currentMain >= plan.deductFromMain) {
          updateData.stockMain = { decrement: plan.deductFromMain };
        } else {
          // Self-heal stockMain if it was 0 or desynced
          const remainingTotal = Math.max(0, Number(inv.stockLevel || 0) - plan.totalDeduction);
          const otherRemaining = 
            (Number(inv.stockKitchen || 0) + Number(inv.stockBar || 0) + Number(inv.stockHousekeeping || 0) + Number(inv.stockBoutique || 0)) - plan.deductFromPrimary;
          updateData.stockMain = Math.max(0, remainingTotal - otherRemaining);
        }
      }

      await this.prisma.inventoryItem.update({
        where: { id: plan.recipe.inventoryItemId },
        data: updateData
      });
    }

    return item;
  }

  async incrementInvoicePrint(orderId: string) {
    return this.prisma.posOrder.update({
      where: { id: orderId },
      data: { invoicePrintCount: { increment: 1 } }
    });
  }

  async incrementReceiptPrint(orderId: string) {
    return this.prisma.posOrder.update({
      where: { id: orderId },
      data: { receiptPrintCount: { increment: 1 } }
    });
  }

  async updateOrderItemStatus(itemId: string, status: string) {
    const existing = await this.prisma.posOrderItem.findUnique({
      where: { id: itemId }
    });
    if (!existing) {
      throw new NotFoundException(`Order item with ID ${itemId} not found`);
    }

    const item = await this.prisma.posOrderItem.update({
      where: { id: itemId },
      data: { status },
      include: { order: { include: { items: { include: { menuItem: { include: { taxes: true } } } } } } }
    });

    if (status === 'SERVED' || status === 'DELIVERED') {
      const orderItems = await this.prisma.posOrderItem.findMany({
        where: { orderId: item.orderId }
      });
      const allServed = orderItems.every(i => ['SERVED', 'DELIVERED', 'RETURNED', 'CANCELLED'].includes(i.status));
      if (allServed) {
        await this.prisma.posOrder.update({
          where: { id: item.orderId },
          data: { status: 'SERVED' }
        });
        await this.recalculateOrderTotal(item.orderId);
      }
    }

    return item;
  }

  async deliverAllOrderItems(orderId: string) {
    // 1. Update all pending/preparing/cooking/ready items to SERVED
    await this.prisma.posOrderItem.updateMany({
      where: {
        orderId,
        status: { in: ['READY', 'PREPARING', 'COOKING', 'PENDING'] }
      },
      data: { status: 'SERVED' }
    });

    // 2. Check if all items in the order are now SERVED, DELIVERED, or RETURNED
    const orderItems = await this.prisma.posOrderItem.findMany({
      where: { orderId }
    });

    const allServed = orderItems.every(i => ['SERVED', 'DELIVERED', 'RETURNED', 'CANCELLED'].includes(i.status));
    if (allServed) {
      await this.prisma.posOrder.update({
        where: { id: orderId },
        data: { status: 'SERVED' }
      });
      await this.recalculateOrderTotal(orderId);
    }

    return { success: true };
  }

  async checkoutOrder(orderId: string, data: { payments?: { method: string; amount: number }[], folioId?: string, discountAmount?: number, discountReason?: string }) {
    const order = await this.prisma.posOrder.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: { include: { taxes: true } } } }, payments: true }
    });

    if (!order) throw new NotFoundException('Order not found');

    // Idempotency guard: if already settled, never double-charge or record duplicate payments
    if (order.status === 'PAID' || order.status === 'BILLED_TO_ROOM') {
      await this.prisma.posOrderItem.updateMany({
        where: {
          orderId,
          status: { notIn: ['SERVED', 'DELIVERED', 'RETURNED', 'CANCELLED'] },
        },
        data: { status: 'SERVED' },
      });
      return this.prisma.posOrder.findUnique({
        where: { id: orderId },
        include: { items: { include: { menuItem: true } }, payments: true }
      });
    }

    // Strict restaurant rule: All items must be prepared and delivered by waitstaff first
    const unservedItems = order.items.filter(
      (i) => !['SERVED', 'DELIVERED', 'RETURNED', 'CANCELLED'].includes(i.status),
    );
    if (unservedItems.length > 0) {
      const hasReturnPending = unservedItems.some((i) => i.status === 'RETURN_REQUESTED');
      if (hasReturnPending) {
        throw new BadRequestException(
          'Cannot complete payment: Order has a pending return request that must be approved or rejected by management first.',
        );
      }
      const hasReady = unservedItems.some((i) => i.status === 'READY');
      if (hasReady) {
        throw new BadRequestException(
          'Cannot complete payment: Items are marked ready at the kitchen/bar and must be delivered by waitstaff first.',
        );
      }
      throw new BadRequestException(
        'Cannot complete payment: Order has not been served yet. All items must pass through the kitchen or bar and be delivered by waitstaff first.',
      );
    }

    let subtotal = 0;

    order.items.forEach(i => {
      if (i.status === 'RETURNED' || i.status === 'RETURN_REQUESTED' || i.status === 'CANCELLED') return;
      const itemTotal = Number(i.menuItem.price) * i.quantity;
      subtotal += itemTotal;
    });

    const appliedDiscount = data.discountAmount !== undefined ? data.discountAmount : Number(order.discountAmount || 0);
    const totalAmount = Math.max(0, subtotal - appliedDiscount); // Prices are tax-inclusive
    
    // Log discount if applied during checkout
    if (appliedDiscount > 0 && Number(order.discountAmount || 0) !== appliedDiscount) {
      this.auditLogsService.logAction({
        action: 'APPLY_DISCOUNT',
        entity: 'PosOrder',
        entityId: orderId,
        oldValues: { discountAmount: Number(order.discountAmount || 0) },
        newValues: { discountAmount: appliedDiscount, ...(data.discountReason ? { discountReason: data.discountReason } : {}) },
        userId: undefined
      }).catch(console.error);
    }

    // If billing to a room
    if (data.folioId || order.folioId) {
      const folioIdToUse = (data.folioId || order.folioId)!;

      await this.prisma.$transaction(async (tx) => {
        const claim = await tx.posOrder.updateMany({
          where: { id: orderId, status: { notIn: ['PAID', 'BILLED_TO_ROOM'] } },
          data: {
            status: 'BILLED_TO_ROOM',
            folioId: folioIdToUse,
            totalAmount,
            discountAmount: appliedDiscount,
            ...(data.discountReason ? { discountReason: data.discountReason } : {}),
          },
        });
        if (claim.count === 0) return;

        await tx.posOrderItem.updateMany({
          where: { orderId, status: { notIn: ['SERVED', 'DELIVERED', 'RETURNED', 'CANCELLED'] } },
          data: { status: 'SERVED' },
        });

        await tx.folioLineItem.create({
          data: {
            folioId: folioIdToUse,
            type: 'CHARGE',
            category: 'F_AND_B',
            amount: totalAmount,
            description: `POS Order #${order.id.substring(0, 8).toUpperCase()}`,
            propertyId: order.propertyId || null,
          }
        });

        await tx.folio.update({
          where: { id: folioIdToUse },
          data: { balance: { increment: totalAmount } }
        });
      });

      return this.prisma.posOrder.findUnique({
        where: { id: orderId },
        include: { items: { include: { menuItem: true } }, payments: true }
      });
    }

    // Process POS payments atomically with conditional status lock
    const paymentsToRecord = (data.payments && data.payments.length > 0)
      ? data.payments
      : [{ method: 'PAYMENT_CASH', amount: totalAmount }];

    await this.prisma.$transaction(async (tx) => {
      const claim = await tx.posOrder.updateMany({
        where: { id: orderId, status: { notIn: ['PAID', 'BILLED_TO_ROOM'] } },
        data: { 
          status: 'PAID', 
          totalAmount, 
          discountAmount: appliedDiscount, 
          ...(data.discountReason ? { discountReason: data.discountReason } : {}) 
        }
      });
      // Another request already settled this order — do not insert duplicate payments
      if (claim.count === 0) return;

      await tx.posOrderItem.updateMany({
        where: { orderId, status: { notIn: ['SERVED', 'DELIVERED', 'RETURNED', 'CANCELLED'] } },
        data: { status: 'SERVED' },
      });

      for (const p of paymentsToRecord) {
        if (Number(p.amount) > 0) {
          await tx.posPayment.create({
            data: {
              orderId,
              amount: p.amount,
              method: p.method || 'PAYMENT_CASH',
              propertyId: order.propertyId || null
            }
          });
        }
      }
    });

    return this.prisma.posOrder.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } }, payments: true }
    });
  }

  async applyDiscount(
    orderId: string, 
    data: { amount: number; value: number; type: 'PERCENT' | 'FLAT'; reason?: string },
    userId?: string,
    userRoles?: string[]
  ) {
    const order = await this.prisma.posOrder.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: { include: { taxes: true } } } } }
    });
    if (!order) throw new NotFoundException('Order not found');

    const rawRoles = userRoles || [];
    const roles = rawRoles.map((r: any) => 
      (typeof r === 'string' ? r : r?.name || '').toUpperCase()
    );
    const isCeoOrAdmin = roles.some(r => ['CEO', 'ADMIN', 'SUPER_ADMIN'].includes(r));
    const isManager = roles.includes('MANAGER');

    let metadata: any = {};
    if (order.discountReason) {
      try {
        metadata = JSON.parse(order.discountReason);
      } catch {
        metadata = { reason: order.discountReason, modifiedCount: 0 };
      }
    }

    const currentDiscount = Number(order.discountAmount || 0);
    const isAlreadyDiscounted = currentDiscount > 0;

    // Strict Role Permission Rules:
    // 1. Cashier CANNOT reverse or alter an already applied discount
    // 2. Manager can modify it ONLY ONCE (modifiedCount < 1)
    // 3. CEO/Admin can modify it UNLIMITED times
    if (isAlreadyDiscounted) {
      if (!isCeoOrAdmin && !isManager) {
        throw new ForbiddenException('Cashiers are not permitted to alter an applied discount.');
      }
      if (isManager && !isCeoOrAdmin) {
        const modifiedCount = Number(metadata.modifiedCount || 0);
        if (modifiedCount >= 1) {
          throw new ForbiddenException('Managers can only modify a discount once. Please contact CEO or Admin for further revisions.');
        }
      }
    }

    // Validate discount amount does not exceed order subtotal
    let subtotal = 0;
    order.items.forEach(i => {
      if (i.status === 'RETURNED' || i.status === 'RETURN_REQUESTED') return;
      subtotal += Number(i.menuItem.price) * i.quantity;
    });

    const discountAmount = Math.min(subtotal, Math.max(0, Number(data.amount)));
    const newModifiedCount = isAlreadyDiscounted ? ((Number(metadata.modifiedCount) || 0) + 1) : 0;
    const newMetadata = {
      amount: discountAmount,
      value: data.value,
      type: data.type,
      reason: data.reason || 'Discount applied',
      appliedBy: userId,
      appliedRole: isCeoOrAdmin ? 'CEO/ADMIN' : isManager ? 'MANAGER' : 'CASHIER',
      modifiedCount: newModifiedCount,
      updatedAt: new Date().toISOString()
    };

    const updated = await this.prisma.posOrder.update({
      where: { id: orderId },
      data: {
        discountAmount,
        discountReason: JSON.stringify(newMetadata)
      },
      include: {
        table: true,
        items: { include: { menuItem: { include: { taxes: true } } } },
        payments: true,
        user: true,
        folio: { include: { reservation: { include: { guest: true, room: true } } } }
      }
    });

    if (userId) {
      await this.auditLogsService.logAction({
        userId,
        action: isAlreadyDiscounted ? 'MODIFY_DISCOUNT' : 'APPLY_DISCOUNT',
        entity: 'PosOrder',
        entityId: orderId,
        oldValues: { discountAmount: currentDiscount },
        newValues: { discountAmount, metadata: newMetadata }
      }).catch(console.error);
    }

    return updated;
  }

  async reverseDiscount(orderId: string, userId?: string, userRoles?: string[]) {
    const order = await this.prisma.posOrder.findUnique({
      where: { id: orderId }
    });
    if (!order) throw new NotFoundException('Order not found');

    const rawRoles = userRoles || [];
    const roles = rawRoles.map((r: any) => 
      (typeof r === 'string' ? r : r?.name || '').toUpperCase()
    );
    const isCeoOrAdmin = roles.some(r => ['CEO', 'ADMIN', 'SUPER_ADMIN'].includes(r));
    const isManager = roles.includes('MANAGER');

    // Strict Role Permission Rules:
    // 1. Cashier CANNOT reverse an applied discount
    // 2. Manager can reverse it ONLY ONCE (modifiedCount < 1)
    // 3. CEO/Admin can reverse it UNLIMITED times
    if (!isCeoOrAdmin && !isManager) {
      throw new ForbiddenException('Cashiers are not permitted to reverse an applied discount.');
    }

    let metadata: any = {};
    if (order.discountReason) {
      try {
        metadata = JSON.parse(order.discountReason);
      } catch {
        metadata = { reason: order.discountReason, modifiedCount: 0 };
      }
    }

    if (isManager && !isCeoOrAdmin) {
      const modifiedCount = Number(metadata.modifiedCount || 0);
      if (modifiedCount >= 1) {
        throw new ForbiddenException('Managers can only modify or reverse a discount once. Please contact CEO or Admin for further revisions.');
      }
    }

    const newModifiedCount = (Number(metadata.modifiedCount) || 0) + 1;
    const newMetadata = {
      reversed: true,
      reversedBy: userId,
      reversedRole: isCeoOrAdmin ? 'CEO/ADMIN' : 'MANAGER',
      modifiedCount: newModifiedCount,
      updatedAt: new Date().toISOString()
    };

    const updated = await this.prisma.posOrder.update({
      where: { id: orderId },
      data: {
        discountAmount: 0,
        discountReason: JSON.stringify(newMetadata)
      },
      include: {
        table: true,
        items: { include: { menuItem: { include: { taxes: true } } } },
        payments: true,
        user: true,
        folio: { include: { reservation: { include: { guest: true, room: true } } } }
      }
    });

    if (userId) {
      await this.auditLogsService.logAction({
        userId,
        action: 'REVERSE_DISCOUNT',
        entity: 'PosOrder',
        entityId: orderId,
        oldValues: { discountAmount: Number(order.discountAmount || 0) },
        newValues: { discountAmount: 0, metadata: newMetadata }
      }).catch(console.error);
    }

    return updated;
  }

  async deleteOrder(id: string) {
    const existing = await this.prisma.posOrder.findUnique({ where: { id } });
    if (!existing) {
      return { success: true, message: 'Order does not exist or already deleted' };
    }
    return this.prisma.$transaction(async (tx) => {
      // Return requested related to order items
      const items = await tx.posOrderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        await tx.posReturnRequest.deleteMany({ where: { orderItemId: item.id } });
      }
      // Delete order items
      await tx.posOrderItem.deleteMany({ where: { orderId: id } });
      // Delete payments
      await tx.posPayment.deleteMany({ where: { orderId: id } });
      // Finally delete order
      return tx.posOrder.delete({ where: { id } });
    });
  }

  // --- Return Workflow ---

  async requestReturn(itemId: string, userId: string, reason?: string, quantity?: number, note?: string) {
    const item = await this.prisma.posOrderItem.findUnique({
      where: { id: itemId },
      include: { menuItem: true, order: true }
    });
    if (!item) throw new NotFoundException("Item not found");
    if (item.status === "RETURNED") {
      throw new BadRequestException("Item is already returned");
    }

    const fullReason = [reason, note].filter(Boolean).join(' - ') || 'Customer return request';

    // If partial return (quantity < item.quantity), split the item!
    if (quantity && quantity > 0 && quantity < item.quantity) {
      const returnQty = quantity;
      const keepQty = item.quantity - returnQty;

      // Update original item with remaining quantity
      await this.prisma.posOrderItem.update({
        where: { id: itemId },
        data: { quantity: keepQty }
      });

      // Create new order item for the returned portion
      const splitItem = await this.prisma.posOrderItem.create({
        data: {
          orderId: item.orderId,
          menuItemId: item.menuItemId,
          quantity: returnQty,
          notes: item.notes,
          status: 'RETURN_REQUESTED'
        }
      });

      // Recalculate order total
      await this.recalculateOrderTotal(item.orderId);

      // Create return request for the split item
      return this.prisma.posReturnRequest.create({
        data: {
          orderItemId: splitItem.id,
          requestedById: userId,
          kitchenNote: fullReason,
          status: 'PENDING_APPROVAL'
        }
      });
    }

    // Full item return
    await this.prisma.posOrderItem.update({
      where: { id: itemId },
      data: { 
        status: 'RETURN_REQUESTED'
      }
    });

    const existing = await this.prisma.posReturnRequest.findFirst({
      where: { orderItemId: itemId },
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      return this.prisma.posReturnRequest.update({
        where: { id: existing.id },
        data: {
          kitchenNote: fullReason,
          status: 'PENDING_APPROVAL'
        }
      });
    }

    return this.prisma.posReturnRequest.create({
      data: {
        orderItemId: itemId,
        requestedById: userId,
        kitchenNote: fullReason,
        status: 'PENDING_APPROVAL'
      }
    });
  }

  async getReturnRequests(start?: string, end?: string) {
    const where: any = {};
    if (start && end) {
      where.OR = [
        { status: { in: ['PENDING_APPROVAL', 'PENDING_CONFIRMATION', 'RETURN_REQUESTED'] } },
        {
          createdAt: {
            gte: new Date(start),
            lte: new Date(new Date(end).setUTCHours(23, 59, 59, 999))
          }
        }
      ];
    }
    return this.prisma.posReturnRequest.findMany({
      where,
      include: {
        orderItem: {
          include: {
            menuItem: true,
            order: { include: { table: true } }
          }
        },
        requestedBy: true,
        confirmedBy: true,
        approvedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }


  async confirmReturnByItemId(itemId: string, userId: string, kitchenNote: string) {
    const existingItem = await this.prisma.posOrderItem.findUnique({
      where: { id: itemId },
    });
    if (!existingItem) {
      throw new NotFoundException(`Order item ${itemId} not found`);
    }

    await this.prisma.posOrderItem.updateMany({
      where: { id: itemId },
      data: { status: 'RETURN_REQUESTED' }
    });

    const returnReq = await this.prisma.posReturnRequest.findFirst({ 
      where: { orderItemId: itemId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!returnReq) {
      return this.prisma.posReturnRequest.create({
        data: {
          orderItemId: itemId,
          requestedById: userId,
          confirmedById: userId,
          kitchenNote,
          status: 'PENDING_APPROVAL'
        }
      });
    }
    
    return this.prisma.posReturnRequest.update({
      where: { id: returnReq.id },
      data: {
        confirmedById: userId,
        kitchenNote,
        status: 'PENDING_APPROVAL'
      }
    });
  }

  async confirmReturn(returnId: string, userId: string, kitchenNote: string) {
    const returnReq = await this.prisma.posReturnRequest.findUnique({ where: { id: returnId } });
    if (!returnReq) throw new NotFoundException('Return request not found');
    
    return this.prisma.posReturnRequest.update({
      where: { id: returnId },
      data: {
        confirmedById: userId,
        kitchenNote,
        status: 'PENDING_APPROVAL'
      }
    });
  }

  async approveReturn(returnId: string, userId: string, approved: boolean) {
    const returnReq = await this.prisma.posReturnRequest.findUnique({ 
      where: { id: returnId },
      include: { orderItem: { include: { menuItem: { include: { taxes: true } }, order: { include: { items: { include: { menuItem: true } } } } } } }
    });
    
    if (!returnReq) throw new Error("Return request not found");
    
    this.auditLogsService.logAction({
      action: approved ? 'APPROVE_RETURN' : 'REJECT_RETURN',
      entity: 'PosReturn',
      entityId: returnId,
      oldValues: { status: returnReq.status },
      newValues: { status: approved ? 'RETURNED' : 'REJECTED' },
      userId: userId
    }).catch(console.error);

    if (!approved) {
      // Reject
      await this.prisma.posOrderItem.update({
        where: { id: returnReq.orderItemId },
        data: { status: 'SERVED' }
      });
      return this.prisma.posReturnRequest.update({
        where: { id: returnId },
        data: { approvedById: userId, status: 'REJECTED' }
      });
    }

    // Approve
    const updatedReturn = await this.prisma.posReturnRequest.update({
      where: { id: returnId },
      data: { approvedById: userId, status: 'APPROVED' }
    });

    await this.prisma.posOrderItem.update({
      where: { id: returnReq.orderItemId },
      data: { status: 'RETURNED' }
    });

          // Always recalculate total amount for the order so dashboard revenue is accurate
      const order = returnReq.orderItem.order;
      await this.recalculateOrderTotal(order.id);

      // If it was already paid in cash/pos, we must log a negative payment to offset the revenue
      if (order.status === 'PAID') {
        const returnedItemTotal = Number(returnReq.orderItem.menuItem.price) * returnReq.orderItem.quantity;
        const refundAmount = returnedItemTotal;

        // Find original payment method if possible, otherwise use 'CASH'
        const payments = await this.prisma.posPayment.findMany({ where: { orderId: order.id } });
        const method = payments.length > 0 ? payments[0].method : 'CASH';

        await this.prisma.posPayment.create({
          data: {
            orderId: order.id,
            amount: -refundAmount,
            method,
            propertyId: order.propertyId || null,
          }
        });
      } else if (order.status === 'BILLED_TO_ROOM' && order.folioId) {
        // Offset folio balance
        const returnedItemTotal = Number(returnReq.orderItem.menuItem.price) * returnReq.orderItem.quantity;
        const refundAmount = returnedItemTotal;

        await this.prisma.folio.update({
          where: { id: order.folioId },
          data: { balance: { decrement: refundAmount } }
        });
        
        // Also add a line item so it shows on Folio!
        await this.prisma.folioLineItem.create({
          data: {
            folioId: order.folioId,
            amount: -refundAmount,
            description: `Refund for POS Order #${order.id.substring(0,8)} - ${returnReq.orderItem.menuItem.name}`,
            category: 'F_AND_B',
            type: 'ADJUSTMENT',
            propertyId: order.propertyId || null,
          }
        });
      }

    return updatedReturn;
  }

  async approveReturnByItemId(itemId: string, userId: string, approved: boolean) {
    const returnReq = await this.prisma.posReturnRequest.findFirst({ 
      where: { orderItemId: itemId },
      orderBy: { createdAt: 'desc' }
    });

    if (!returnReq) {
      if (approved) {
        const createdReq = await this.prisma.posReturnRequest.create({
          data: {
            orderItemId: itemId,
            requestedById: userId,
            confirmedById: userId,
            kitchenNote: 'Direct inline return approval',
            status: 'PENDING_APPROVAL',
          },
        });
        return this.approveReturn(createdReq.id, userId, true);
      } else {
        await this.prisma.posOrderItem.update({
          where: { id: itemId },
          data: { status: 'SERVED' }
        });
        return { success: true };
      }
    }

    return this.approveReturn(returnReq.id, userId, approved);
  }
}



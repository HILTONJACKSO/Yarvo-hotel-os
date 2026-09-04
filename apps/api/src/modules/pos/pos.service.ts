import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  // ─── TABLES ─────────────────────────────────────────────────────────────
  async getTables() {
    return this.prisma.posTable.findMany({
      orderBy: { number: 'asc' },
    });
  }

  async createTable(data: { number: string; capacity: number }) {
    return this.prisma.posTable.create({ data });
  }

  async deleteTable(id: string) {
    return this.prisma.posTable.delete({ where: { id } });
  }

  // ─── MENU ─────────────────────────────────────────────────────────────
  async getCategories() {
    return this.prisma.posCategory.findMany({
      include: { items: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data: { name: string }) {
    return this.prisma.posCategory.create({ data });
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

  async getMenuItems() {
    return this.prisma.posMenuItem.findMany({
      include: { category: true, recipes: true, taxes: true },
      orderBy: { name: 'asc' },
    });
  }

  async createMenuItem(data: { categoryId: string; name: string; description?: string; price: number; type?: string; inventoryItemId?: string; image?: string; taxIds?: string[] }) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.posMenuItem.create({ 
        data: {
          categoryId: data.categoryId,
          name: data.name,
          description: data.description,
          price: data.price,
          type: data.type || 'FOOD',
          image: data.image,
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

  async updateMenuItem(id: string, data: { categoryId?: string; name?: string; description?: string; price?: number; type?: string; inventoryItemId?: string; image?: string; taxIds?: string[] }, userId?: string) {
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
  async getActiveOrders() {
    return this.prisma.posOrder.findMany({
      where: { 
        OR: [
          { status: { notIn: ['PAID', 'BILLED_TO_ROOM', 'SERVED'] } },
          { items: { some: { status: 'RETURN_REQUESTED' } } }
        ]
      },
      include: {
        table: true,
        guest: true,
        user: { select: { firstName: true, lastName: true } },
        items: {
          include: { menuItem: true, returnRequest: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReadyOrderItems() {
    return this.prisma.posOrderItem.findMany({
      where: { status: 'READY' },
      include: {
        menuItem: true,
        order: { include: { table: true, guest: true, user: { select: { firstName: true, lastName: true } }, folio: { include: { reservation: { include: { room: true } } } } } }
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getServedOrders() {
    return this.prisma.posOrder.findMany({
      where: { status: 'SERVED' },
      include: {
        table: true,
        guest: true,
        user: { select: { firstName: true, lastName: true } },
        folio: { include: { reservation: { include: { room: true, guest: true } } } },
        items: { include: { menuItem: true } }
      },
      orderBy: { updatedAt: 'asc' }
    });
  }

  async createOrder(data: { tableId?: string; folioId?: string; guestId?: string; userId?: string; userRoles?: string[]; discountAmount?: number; notes?: string }) {
    // Check if an OPEN or SERVED order already exists for this destination to consolidate bills
    if (data.tableId) {
      const existing = await this.prisma.posOrder.findFirst({
        where: { tableId: data.tableId, status: { in: ['OPEN', 'SERVED'] } },
        orderBy: { createdAt: 'desc' }
      });
      if (existing) {
        if (existing.invoicePrintCount > 0) {
          const isAdmin = data.userRoles?.includes('SUPER_ADMIN') || data.userRoles?.includes('ADMIN') || data.userRoles?.includes('CEO');
          if (!isAdmin) {
            throw new ForbiddenException('Invoice has already been printed. Only Admin or CEO can edit this bill.');
          }
        }

        if (data.discountAmount !== undefined || data.notes !== undefined) {
          return this.prisma.posOrder.update({ 
            where: { id: existing.id }, 
            data: { 
              ...(data.discountAmount !== undefined ? { discountAmount: data.discountAmount } : {}),
              ...(data.notes !== undefined ? { notes: data.notes } : {})
            }
          });
        }
        return existing;
      }
    } else if (data.folioId) {
      const existing = await this.prisma.posOrder.findFirst({
        where: { folioId: data.folioId, status: { in: ['OPEN', 'SERVED'] } },
        orderBy: { createdAt: 'desc' }
      });
      if (existing) {
        if (existing.invoicePrintCount > 0) {
          const isAdmin = data.userRoles?.includes('SUPER_ADMIN') || data.userRoles?.includes('ADMIN') || data.userRoles?.includes('CEO');
          if (!isAdmin) {
            throw new ForbiddenException('Invoice has already been printed. Only Admin or CEO can edit this bill.');
          }
        }

        if (data.discountAmount !== undefined || data.notes !== undefined) {
          return this.prisma.posOrder.update({ 
            where: { id: existing.id }, 
            data: { 
              ...(data.discountAmount !== undefined ? { discountAmount: data.discountAmount } : {}),
              ...(data.notes !== undefined ? { notes: data.notes } : {})
            }
          });
        }
        return existing;
      }
    } else if (data.guestId) {
      const existing = await this.prisma.posOrder.findFirst({
        where: { guestId: data.guestId, status: { in: ['OPEN', 'SERVED'] } },
        orderBy: { createdAt: 'desc' }
      });
      if (existing) {
        if (existing.invoicePrintCount > 0) {
          const isAdmin = data.userRoles?.includes('SUPER_ADMIN') || data.userRoles?.includes('ADMIN') || data.userRoles?.includes('CEO');
          if (!isAdmin) {
            throw new ForbiddenException('Invoice has already been printed. Only Admin or CEO can edit this bill.');
          }
        }

        if (data.discountAmount !== undefined || data.notes !== undefined) {
          return this.prisma.posOrder.update({ 
            where: { id: existing.id }, 
            data: { 
              ...(data.discountAmount !== undefined ? { discountAmount: data.discountAmount } : {}),
              ...(data.notes !== undefined ? { notes: data.notes } : {})
            }
          });
        }
        return existing;
      }
    }

    return this.prisma.posOrder.create({
      data: {
        tableId: data.tableId,
        folioId: data.folioId,
        guestId: data.guestId,
        userId: data.userId,
        status: 'OPEN',
        discountAmount: data.discountAmount || 0,
        notes: data.notes,
      },
    });
  }

  async addOrderItem(orderId: string, data: { menuItemId: string; quantity: number; notes?: string }) {
    const item = await this.prisma.posOrderItem.create({
      data: {
        orderId,
        menuItemId: data.menuItemId,
        quantity: data.quantity,
        notes: data.notes,
        status: 'PENDING',
      },
    });

    // Revert the order back to OPEN if it was SERVED
    await this.prisma.posOrder.updateMany({
      where: { id: orderId, status: 'SERVED' },
      data: { status: 'OPEN' }
    });
    
    // Fetch menu item to determine type (FOOD -> Kitchen, DRINK -> Bar)
    const menuItem = await this.prisma.posMenuItem.findUnique({
      where: { id: data.menuItemId }
    });

    let deductField = 'stockMain';
    if (menuItem?.type === 'DRINK' || menuItem?.type === 'BAR') deductField = 'stockBar';
    if (menuItem?.type === 'FOOD') deductField = 'stockKitchen';

    // Auto deduct inventory if recipes exist
    const recipes = await this.prisma.inventoryRecipe.findMany({
      where: { menuItemId: data.menuItemId }
    });
    
    for (const recipe of recipes) {
      const deductionAmount = Number(recipe.quantity) * data.quantity;
      await this.prisma.inventoryItem.update({
        where: { id: recipe.inventoryItemId },
        data: {
          [deductField]: { decrement: deductionAmount },
          stockLevel: { decrement: deductionAmount }
        }
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

  async updateOrderItemStatus(itemId: string, status: string) {
    const item = await this.prisma.posOrderItem.update({
      where: { id: itemId },
      data: { status },
      include: { order: { include: { items: { include: { menuItem: { include: { taxes: true } } } } } } }
    });

    if (status === 'SERVED') {
      const allServed = item.order.items.every(i => i.status === 'SERVED');
      if (allServed) {
        let subtotal = 0;
        let calculatedTax = 0;
        item.order.items.forEach(i => {
          const itemTotal = Number(i.menuItem.price) * i.quantity;
          subtotal += itemTotal;
          let totalPercentage = 0;
          let totalFlat = 0;
          
          (i.menuItem as any).taxes?.forEach((tax: any) => {
            if (tax.isActive) {
              if (tax.type === 'PERCENTAGE') totalPercentage += Number(tax.rate);
              else if (tax.type === 'FLAT_AMOUNT') totalFlat += Number(tax.rate) * i.quantity;
            }
          });
          const itemBeforeTax = (itemTotal - totalFlat) / (1 + totalPercentage / 100);
          calculatedTax += (itemTotal - itemBeforeTax);
        });
        
        const finalTotal = Math.max(0, subtotal - Number(item.order.discountAmount || 0));
        
        await this.prisma.posOrder.update({
          where: { id: item.orderId },
          data: { status: 'SERVED', totalAmount: finalTotal }
        });
      }
    }

    return item;
  }

  async checkoutOrder(orderId: string, data: { payments?: { method: string; amount: number }[], folioId?: string, discountAmount?: number }) {
    const order = await this.prisma.posOrder.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: { include: { taxes: true } } } } }
    });

    if (!order) throw new NotFoundException('Order not found');

    let subtotal = 0;
    let calculatedTax = 0;

    order.items.forEach(i => {
      const itemTotal = Number(i.menuItem.price) * i.quantity;
      subtotal += itemTotal;
      let totalPercentage = 0;
      let totalFlat = 0;
      
      i.menuItem.taxes?.forEach(tax => {
        if (tax.isActive) {
          if (tax.type === 'PERCENTAGE') totalPercentage += Number(tax.rate);
          else if (tax.type === 'FLAT_AMOUNT') totalFlat += Number(tax.rate) * i.quantity;
        }
      });
      const itemBeforeTax = (itemTotal - totalFlat) / (1 + totalPercentage / 100);
      calculatedTax += (itemTotal - itemBeforeTax);
    });

    const appliedDiscount = data.discountAmount !== undefined ? data.discountAmount : Number(order.discountAmount || 0);
    const totalAmount = Math.max(0, subtotal - appliedDiscount); // Prices are tax-inclusive
    
    // Log discount if applied during checkout
    if (appliedDiscount > 0 && order.discountAmount !== appliedDiscount) {
      this.auditLogsService.logAction({
        action: 'APPLY_DISCOUNT',
        entity: 'PosOrder',
        entityId: orderId,
        oldValues: { discountAmount: Number(order.discountAmount || 0) },
        newValues: { discountAmount: appliedDiscount },
        userId: null
      }).catch(console.error);
    }

    // If billing to a room
    if (data.folioId || order.folioId) {
      const folioIdToUse = data.folioId || order.folioId;
      
      // Create a FolioLineItem for the charge
      await this.prisma.folioLineItem.create({
        data: {
          folioId: folioIdToUse!,
          type: 'CHARGE',
          category: 'F_AND_B',
          amount: totalAmount,
          description: `POS Order #${order.id.substring(0, 8).toUpperCase()}`,
        }
      });

      // Update Folio balance
      await this.prisma.folio.update({
        where: { id: folioIdToUse! },
        data: { balance: { increment: totalAmount } }
      });

      return this.prisma.posOrder.update({
        where: { id: orderId },
        data: { status: 'BILLED_TO_ROOM', folioId: folioIdToUse, totalAmount, discountAmount: appliedDiscount }
      });
    }

    // Otherwise, process POS split payments
    if (data.payments && data.payments.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const p of data.payments!) {
          await tx.posPayment.create({
            data: {
              orderId,
              amount: p.amount,
              method: p.method
            }
          });
        }
        await tx.posOrder.update({
          where: { id: orderId },
          data: { status: 'PAID', totalAmount, discountAmount: appliedDiscount }
        });
      });
      return this.prisma.posOrder.findUnique({ where: { id: orderId } });
    }

    return this.prisma.posOrder.update({
      where: { id: orderId },
      data: { status: 'PAID', totalAmount, discountAmount: appliedDiscount }
    });
  }

  // --- Return Workflow ---

  async requestReturn(itemId: string, userId: string) {
    const item = await this.prisma.posOrderItem.findUnique({
      where: { id: itemId }
    });
    if (!item) throw new Error("Item not found");
    if (item.status === "RETURN_REQUESTED" || item.status === "RETURNED") {
      throw new Error("Item is already requested for return or returned");
    }

    await this.prisma.posOrderItem.update({
      where: { id: itemId },
      data: { status: 'RETURN_REQUESTED' }
    });

    return this.prisma.posReturnRequest.create({
      data: {
        orderItemId: itemId,
        requestedById: userId,
        status: 'PENDING_CONFIRMATION'
      }
    });
  }

  async getReturnRequests() {
    return this.prisma.posReturnRequest.findMany({
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

  async confirmReturn(returnId: string, userId: string, kitchenNote: string) {
    const returnReq = await this.prisma.posReturnRequest.findUnique({ where: { id: returnId } });
    if (!returnReq) throw new Error("Return request not found");
    
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
      include: { orderItem: { include: { order: { include: { items: { include: { menuItem: true } } } } } } }
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

    // Recalculate total amount for the order if it hasn't been PAID
    const order = returnReq.orderItem.order;
    if (order.status !== 'PAID' && order.status !== 'BILLED_TO_ROOM') {
      let newTotal = 0;
      order.items.forEach(i => {
        // Exclude the returned item when recalculating
        if (i.id !== returnReq.orderItemId && i.status !== 'RETURNED') {
          newTotal += Number(i.menuItem.price) * i.quantity;
        }
      });
      await this.prisma.posOrder.update({
        where: { id: order.id },
        data: { totalAmount: newTotal }
      });
    }

    return updatedReturn;
  }
}


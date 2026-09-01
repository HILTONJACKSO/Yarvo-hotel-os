import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

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

  async updateCategory(id: string, data: { name: string }) {
    return this.prisma.posCategory.update({
      where: { id },
      data
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

  async updateMenuItem(id: string, data: { categoryId?: string; name?: string; description?: string; price?: number; type?: string; inventoryItemId?: string; image?: string; taxIds?: string[] }) {
    return this.prisma.$transaction(async (tx) => {
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
      where: { status: { notIn: ['PAID', 'BILLED_TO_ROOM', 'SERVED'] } },
      include: {
        table: true,
        user: { select: { firstName: true, lastName: true } },
        items: {
          include: { menuItem: true },
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
        order: { include: { table: true, user: { select: { firstName: true, lastName: true } }, folio: { include: { reservation: { include: { room: true } } } } } }
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getServedOrders() {
    return this.prisma.posOrder.findMany({
      where: { status: 'SERVED' },
      include: {
        table: true,
        user: { select: { firstName: true, lastName: true } },
        folio: { include: { reservation: { include: { room: true, guest: true } } } },
        items: { include: { menuItem: true } }
      },
      orderBy: { updatedAt: 'asc' }
    });
  }

  async createOrder(data: { tableId?: string; folioId?: string; userId?: string }) {
    return this.prisma.posOrder.create({
      data: {
        tableId: data.tableId,
        folioId: data.folioId,
        userId: data.userId,
        status: 'OPEN',
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
          
          (i.menuItem as any).taxes?.forEach((tax: any) => {
            if (tax.isActive) {
              if (tax.type === 'PERCENTAGE') {
                calculatedTax += itemTotal * (Number(tax.rate) / 100);
              } else if (tax.type === 'FLAT_AMOUNT') {
                calculatedTax += Number(tax.rate) * i.quantity;
              }
            }
          });
        });
        
        const total = subtotal + calculatedTax;
        
        await this.prisma.posOrder.update({
          where: { id: item.orderId },
          data: { status: 'SERVED', totalAmount: total }
        });
      }
    }

    return item;
  }

  async checkoutOrder(orderId: string, data: { payments?: { method: string; amount: number }[], folioId?: string }) {
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
      
      i.menuItem.taxes?.forEach(tax => {
        if (tax.isActive) {
          if (tax.type === 'PERCENTAGE') {
            calculatedTax += itemTotal * (Number(tax.rate) / 100);
          } else if (tax.type === 'FLAT_AMOUNT') {
            calculatedTax += Number(tax.rate) * i.quantity;
          }
        }
      });
    });

    const totalAmount = order.totalAmount || (subtotal + calculatedTax);

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
        data: { status: 'BILLED_TO_ROOM', folioId: folioIdToUse, totalAmount }
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
          data: { status: 'PAID', totalAmount }
        });
      });
      return this.prisma.posOrder.findUnique({ where: { id: orderId } });
    }

    return this.prisma.posOrder.update({
      where: { id: orderId },
      data: { status: 'PAID', totalAmount }
    });
  }
}


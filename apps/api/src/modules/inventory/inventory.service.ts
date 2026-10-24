import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async getInventoryItems(propertyId?: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: propertyId ? { OR: [{ propertyId }, { propertyId: null }] } : {},
      orderBy: { name: 'asc' },
    });

    // Auto-heal items in response where stockMain was left 0 despite unallocated stockLevel
    return items.map(item => {
      const totalStock = Number(item.stockLevel || 0);
      const otherAllocated = 
        Number(item.stockKitchen || 0) + 
        Number(item.stockBar || 0) + 
        Number(item.stockHousekeeping || 0) + 
        Number(item.stockBoutique || 0);
      const unallocated = Math.max(0, totalStock - otherAllocated);
      const currentMain = Number(item.stockMain || 0);

      if (currentMain < unallocated) {
        return {
          ...item,
          stockMain: unallocated as any
        };
      }
      return item;
    });
  }

  async createInventoryItem(data: { name: string; category?: string; unit: string; stockLevel?: number; minThreshold?: number; costPerUnit?: number }, userId?: string, propertyId?: string) {
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        ...(propertyId ? { propertyId } : {}),
      }
    });
    if (existingItem) {
      throw new BadRequestException('An item with this name already exists in the system');
    }

    const initialStock = data.stockLevel !== undefined ? Number(data.stockLevel) : 0;

    return this.prisma.$transaction(async (tx) => {
      const newItem = await tx.inventoryItem.create({
        data: {
          name: data.name,
          category: data.category || 'GENERAL',
          unit: data.unit,
          stockLevel: initialStock,
          stockMain: initialStock,
          stockKitchen: 0,
          stockBar: 0,
          stockHousekeeping: 0,
          stockBoutique: 0,
          minThreshold: data.minThreshold !== undefined ? Number(data.minThreshold) : 10,
          costPerUnit: data.costPerUnit !== undefined ? Number(data.costPerUnit) : 0,
          ...(propertyId ? { propertyId } : {}),
        }
      });

      if (userId) {
        await this.auditLogsService.logAction({
          userId,
          action: 'CREATE_INVENTORY_ITEM',
          entity: 'InventoryItem',
          entityId: newItem.id,
          newValues: newItem
        });
      }

      return newItem;
    });
  }

  async updateStock(id: string, amount: number, userId?: string) {
    const numAmount = Number(amount);
    return this.prisma.$transaction(async (tx) => {
      const oldRecord = await tx.inventoryItem.findUnique({ where: { id } });
      if (!oldRecord) throw new NotFoundException('Item not found');

      const otherAllocated = 
        Number(oldRecord.stockKitchen || 0) + 
        Number(oldRecord.stockBar || 0) + 
        Number(oldRecord.stockHousekeeping || 0) + 
        Number(oldRecord.stockBoutique || 0);
      const newStockMain = Math.max(0, numAmount - otherAllocated);

      const newRecord = await tx.inventoryItem.update({
        where: { id },
        data: { 
          stockLevel: numAmount,
          stockMain: newStockMain
        },
      });
      if (oldRecord) {
        await this.auditLogsService.logAction({
          userId,
          action: 'UPDATE_INVENTORY_STOCK',
          entity: 'InventoryItem',
          entityId: id,
          oldValues: oldRecord,
          newValues: newRecord
        });
      }
      return newRecord;
    });
  }

  async updateInventoryItem(id: string, data: { name: string; category?: string; unit: string; stockLevel?: number; minThreshold?: number; costPerUnit?: number }, userId?: string, propertyId?: string) {
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: { 
        name: { equals: data.name, mode: 'insensitive' },
        id: { not: id },
        ...(propertyId ? { propertyId } : {}),
      }
    });
    if (existingItem) {
      throw new BadRequestException('An item with this name already exists in the system');
    }

    return this.prisma.$transaction(async (tx) => {
      const oldRecord = await tx.inventoryItem.findUnique({ where: { id } });
      if (!oldRecord) throw new NotFoundException('Item not found');

      const otherAllocated = 
        Number(oldRecord.stockKitchen || 0) + 
        Number(oldRecord.stockBar || 0) + 
        Number(oldRecord.stockHousekeeping || 0) + 
        Number(oldRecord.stockBoutique || 0);
      
      const newStockLevel = data.stockLevel !== undefined ? Number(data.stockLevel) : Number(oldRecord.stockLevel || 0);
      const newStockMain = Math.max(0, newStockLevel - otherAllocated);

      const newRecord = await tx.inventoryItem.update({
        where: { id },
        data: {
          name: data.name,
          category: data.category || oldRecord.category,
          unit: data.unit || oldRecord.unit,
          stockLevel: newStockLevel,
          stockMain: newStockMain,
          minThreshold: data.minThreshold !== undefined ? Number(data.minThreshold) : oldRecord.minThreshold,
          costPerUnit: data.costPerUnit !== undefined ? Number(data.costPerUnit) : oldRecord.costPerUnit
        }
      });

      if (oldRecord) {
        await this.auditLogsService.logAction({
          userId,
          action: 'EDIT_INVENTORY_ITEM',
          entity: 'InventoryItem',
          entityId: id,
          oldValues: oldRecord,
          newValues: newRecord
        });
      }

      return newRecord;
    });
  }

  async deleteInventoryItem(id: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldRecord = await tx.inventoryItem.findUnique({ where: { id } });
      if (!oldRecord) {
        throw new NotFoundException('Inventory item not found');
      }

      // Explicitly delete any recipe links referencing this inventory item
      await tx.inventoryRecipe.deleteMany({
        where: { inventoryItemId: id }
      });

      const deletedItem = await tx.inventoryItem.delete({
        where: { id }
      });
      if (userId && oldRecord) {
        await this.auditLogsService.logAction({
          userId,
          action: 'DELETE_INVENTORY_ITEM',
          entity: 'InventoryItem',
          entityId: id,
          oldValues: oldRecord
        });
      }
      return deletedItem;
    });
  }

  async stockIn(id: string, data: { amount: number, costPerUnit?: number }, userId?: string) {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Stock in amount must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const oldRecord = await tx.inventoryItem.findUnique({ where: { id } });
      if (!oldRecord) throw new NotFoundException('Item not found');

      const total = Number(oldRecord.stockLevel || 0);
      const otherAllocated = 
        Number(oldRecord.stockKitchen || 0) + 
        Number(oldRecord.stockBar || 0) + 
        Number(oldRecord.stockHousekeeping || 0) + 
        Number(oldRecord.stockBoutique || 0);
      const unallocated = Math.max(0, total - otherAllocated);
      const currentMain = Math.max(Number(oldRecord.stockMain || 0), unallocated);

      const newRecord = await tx.inventoryItem.update({
        where: { id },
        data: {
          stockLevel: total + amount,
          stockMain: currentMain + amount,
          ...(data.costPerUnit !== undefined ? { costPerUnit: Number(data.costPerUnit) } : {})
        },
      });

      await this.auditLogsService.logAction({
        userId,
        action: 'STOCK_IN',
        entity: 'InventoryItem',
        entityId: id,
        oldValues: oldRecord,
        newValues: newRecord
      });
      return newRecord;
    });
  }

  async stockOut(id: string, data: { amount: number, staffName: string, reason?: string, location?: string }, userId?: string) {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Stock out amount must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const oldRecord = await tx.inventoryItem.findUnique({ where: { id } });
      if (!oldRecord) throw new NotFoundException('Item not found');

      const locMap: Record<string, string> = {
        'MAIN': 'stockMain',
        'BAR': 'stockBar',
        'KITCHEN': 'stockKitchen',
        'HOUSEKEEPING': 'stockHousekeeping',
        'BOUTIQUE': 'stockBoutique'
      };
      const locKey = data.location ? data.location.toUpperCase() : 'MAIN';
      const targetField = locMap[locKey] || 'stockMain';

      const totalStock = Number(oldRecord.stockLevel || 0);
      if (totalStock < amount) {
        throw new BadRequestException(`Not enough total stock available to stock out ${amount}. Available in hotel: ${totalStock}`);
      }

      let currentLocStock = Number((oldRecord as any)[targetField]) || 0;
      if (targetField === 'stockMain') {
        const otherAllocated = 
          Number(oldRecord.stockKitchen || 0) + 
          Number(oldRecord.stockBar || 0) + 
          Number(oldRecord.stockHousekeeping || 0) + 
          Number(oldRecord.stockBoutique || 0);
        const unallocated = Math.max(0, totalStock - otherAllocated);
        if (currentLocStock < unallocated) currentLocStock = unallocated;
      }

      const updateData: any = {
        stockLevel: Math.max(0, totalStock - amount),
      };

      if (currentLocStock >= amount) {
        updateData[targetField] = Math.max(0, currentLocStock - amount);
      } else {
        let remainder = amount - currentLocStock;
        updateData[targetField] = 0;

        const locationFields = ['stockMain', 'stockBar', 'stockKitchen', 'stockHousekeeping', 'stockBoutique'];
        for (const field of locationFields) {
          if (field === targetField) continue;
          if (remainder <= 0) break;
          const availableInField = Number((oldRecord as any)[field]) || 0;
          if (availableInField > 0) {
            const deduct = Math.min(availableInField, remainder);
            updateData[field] = Math.max(0, availableInField - deduct);
            remainder -= deduct;
          }
        }
      }

      const newRecord = await tx.inventoryItem.update({
        where: { id },
        data: updateData,
      });

      await this.auditLogsService.logAction({
        userId,
        action: 'STOCK_OUT',
        entity: 'InventoryItem',
        entityId: id,
        oldValues: { ...oldRecord, _stockOutDetails: data },
        newValues: newRecord
      });
      return newRecord;
    });
  }

  async addRecipeIngredient(data: { menuItemId: string; inventoryItemId: string; quantity: number }) {
    return this.prisma.inventoryRecipe.create({ data });
  }

  async transferStock(id: string, data: { from: string, to: string, amount: number }, userId?: string) {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Transfer amount must be a positive number');
    }

    const fieldMap: Record<string, string> = {
      'MAIN': 'stockMain',
      'KITCHEN': 'stockKitchen',
      'BAR': 'stockBar',
      'HOUSEKEEPING': 'stockHousekeeping',
      'BOUTIQUE': 'stockBoutique'
    };

    const fromKey = (data.from || '').toUpperCase();
    const toKey = (data.to || '').toUpperCase();
    const fromField = fieldMap[fromKey];
    const toField = fieldMap[toKey];

    if (!fromField || !toField) throw new BadRequestException(`Invalid department: ${data.from} or ${data.to}`);
    if (fromField === toField) throw new BadRequestException('Source and destination cannot be the same');

    return this.prisma.$transaction(async (tx) => {
      const item: any = await tx.inventoryItem.findUnique({ where: { id } });
      if (!item) throw new NotFoundException('Item not found');

      let currentFromStock = Number(item[fromField]) || 0;

      // Auto-heal stockMain if source is MAIN and stockMain had desynced from unallocated stockLevel
      if (fromField === 'stockMain') {
        const total = Number(item.stockLevel || 0);
        const otherAllocated = 
          Number(item.stockKitchen || 0) + 
          Number(item.stockBar || 0) + 
          Number(item.stockHousekeeping || 0) + 
          Number(item.stockBoutique || 0);
        const unallocated = Math.max(0, total - otherAllocated);
        if (currentFromStock < unallocated) {
          currentFromStock = unallocated;
        }
      }

      if (currentFromStock < amount) {
        throw new BadRequestException(`Not enough stock in ${fromKey}. Available: ${currentFromStock}, Requested: ${amount}`);
      }

      const newFromStock = Math.max(0, currentFromStock - amount);
      const currentToStock = Number(item[toField]) || 0;
      const newToStock = currentToStock + amount;

      const newRecord = await tx.inventoryItem.update({
        where: { id },
        data: {
          [fromField]: newFromStock,
          [toField]: newToStock,
        }
      });

      await this.auditLogsService.logAction({
        userId,
        action: 'TRANSFER_INVENTORY_STOCK',
        entity: 'InventoryItem',
        entityId: id,
        oldValues: item,
        newValues: newRecord
      });

      return newRecord;
    });
  }
}

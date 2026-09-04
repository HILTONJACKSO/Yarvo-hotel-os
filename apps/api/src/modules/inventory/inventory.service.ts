import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async getInventoryItems() {
    return this.prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createInventoryItem(data: { name: string; category?: string; unit: string; stockLevel?: number; minThreshold?: number; costPerUnit?: number }, userId?: string) {
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } }
    });
    if (existingItem) {
      throw new BadRequestException('An item with this name already exists in the system');
    }

    return this.prisma.$transaction(async (tx) => {
      const newItem = await tx.inventoryItem.create({
        data: {
          name: data.name,
          category: data.category || 'GENERAL',
          unit: data.unit,
          stockLevel: data.stockLevel || 0,
          stockMain: data.stockLevel || 0,
          minThreshold: data.minThreshold || 10,
          costPerUnit: data.costPerUnit || 0
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
    return this.prisma.$transaction(async (tx) => {
      const oldRecord = await tx.inventoryItem.findUnique({ where: { id } });
      const newRecord = await tx.inventoryItem.update({
        where: { id },
        data: { stockLevel: amount },
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

  async updateInventoryItem(id: string, data: { name: string; category?: string; unit: string; stockLevel?: number; minThreshold?: number; costPerUnit?: number }, userId?: string) {
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: { 
        name: { equals: data.name, mode: 'insensitive' },
        id: { not: id }
      }
    });
    if (existingItem) {
      throw new BadRequestException('An item with this name already exists in the system');
    }

    return this.prisma.$transaction(async (tx) => {
      const oldRecord = await tx.inventoryItem.findUnique({ where: { id } });
      const newRecord = await tx.inventoryItem.update({
        where: { id },
        data: {
          name: data.name,
          category: data.category,
          unit: data.unit,
          stockLevel: data.stockLevel,
          minThreshold: data.minThreshold,
          costPerUnit: data.costPerUnit
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
    return this.prisma.$transaction(async (tx) => {
      const oldRecord = await tx.inventoryItem.findUnique({ where: { id } });
      if (!oldRecord) throw new NotFoundException('Item not found');

      const newRecord = await tx.inventoryItem.update({
        where: { id },
        data: {
          stockLevel: { increment: data.amount },
          stockMain: { increment: data.amount },
          ...(data.costPerUnit !== undefined ? { costPerUnit: data.costPerUnit } : {})
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

  async stockOut(id: string, data: { amount: number, staffName: string, reason?: string }, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldRecord = await tx.inventoryItem.findUnique({ where: { id } });
      if (!oldRecord) throw new NotFoundException('Item not found');

      const currentMain = Number(oldRecord.stockMain) || 0;
      if (currentMain < data.amount) {
        throw new BadRequestException(`Not enough stock in Main Storage to stock out ${data.amount}. Current: ${currentMain}`);
      }

      const newRecord = await tx.inventoryItem.update({
        where: { id },
        data: {
          stockLevel: { decrement: data.amount },
          stockMain: { decrement: data.amount },
        },
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
    const fieldMap: Record<string, string> = {
      'MAIN': 'stockMain',
      'KITCHEN': 'stockKitchen',
      'BAR': 'stockBar',
      'HOUSEKEEPING': 'stockHousekeeping'
    };

    const fromField = fieldMap[data.from];
    const toField = fieldMap[data.to];

    if (!fromField || !toField) throw new BadRequestException('Invalid department');
    if (fromField === toField) throw new BadRequestException('Source and destination cannot be the same');

    return this.prisma.$transaction(async (tx) => {
      const item: any = await tx.inventoryItem.findUnique({ where: { id } });
      if (!item) throw new NotFoundException('Item not found');

      const currentFromStock = Number(item[fromField]);
      if (currentFromStock < data.amount) {
        throw new BadRequestException(`Not enough stock in ${data.from}`);
      }

      const newRecord = await tx.inventoryItem.update({
        where: { id },
        data: {
          [fromField]: { decrement: data.amount },
          [toField]: { increment: data.amount },
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


import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventoryItems() {
    return this.prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createInventoryItem(data: { name: string; category?: string; unit: string; stockLevel?: number; minThreshold?: number; costPerUnit?: number }) {
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } }
    });
    if (existingItem) {
      throw new BadRequestException('An item with this name already exists in the system');
    }

    return this.prisma.inventoryItem.create({
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
  }

  async updateStock(id: string, amount: number) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { stockLevel: amount },
    });
  }

  async updateInventoryItem(id: string, data: { name: string; category?: string; unit: string; stockLevel?: number; minThreshold?: number; costPerUnit?: number }) {
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: { 
        name: { equals: data.name, mode: 'insensitive' },
        id: { not: id }
      }
    });
    if (existingItem) {
      throw new BadRequestException('An item with this name already exists in the system');
    }

    return this.prisma.inventoryItem.update({
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
  }

  async deleteInventoryItem(id: string) {
    return this.prisma.inventoryItem.delete({
      where: { id }
    });
  }

  async addRecipeIngredient(data: { menuItemId: string; inventoryItemId: string; quantity: number }) {
    return this.prisma.inventoryRecipe.create({ data });
  }

  async transferStock(id: string, data: { from: string, to: string, amount: number }) {
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

      return tx.inventoryItem.update({
        where: { id },
        data: {
          [fromField]: { decrement: data.amount },
          [toField]: { increment: data.amount },
        }
      });
    });
  }
}


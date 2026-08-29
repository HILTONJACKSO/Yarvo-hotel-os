import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Inventory')
@ApiCookieAuth('accessToken')
@Roles('SUPER_ADMIN', 'MANAGER')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  getInventoryItems() {
    return this.inventoryService.getInventoryItems();
  }

  @Post()
  @Roles('SUPER_ADMIN', 'MANAGER')
  createInventoryItem(@Body() data: { name: string; category?: string; unit: string; stockLevel?: number; minThreshold?: number; costPerUnit?: number }) {
    return this.inventoryService.createInventoryItem(data);
  }

  @Patch(':id/stock')
  @Roles('SUPER_ADMIN', 'MANAGER')
  updateStock(@Param('id') id: string, @Body('amount') amount: number) {
    return this.inventoryService.updateStock(id, amount);
  }

  @Post(':id/transfer')
  @Roles('SUPER_ADMIN', 'MANAGER')
  transferStock(
    @Param('id') id: string,
    @Body() data: { from: string, to: string, amount: number }
  ) {
    return this.inventoryService.transferStock(id, data);
  }

  @Post('recipes')
  addRecipeIngredient(@Body() data: { menuItemId: string; inventoryItemId: string; quantity: number }) {
    return this.inventoryService.addRecipeIngredient(data);
  }
}


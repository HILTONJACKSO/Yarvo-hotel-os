import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Inventory')
@ApiCookieAuth('accessToken')
@Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'CASHIER')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  getInventoryItems() {
    return this.inventoryService.getInventoryItems();
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  createInventoryItem(@Body() data: { name: string; category?: string; unit: string; stockLevel?: number; minThreshold?: number; costPerUnit?: number }, @Req() req: any) {
    return this.inventoryService.createInventoryItem(data, req.user?.id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  updateInventoryItem(@Param('id') id: string, @Body() data: { name: string; category?: string; unit: string; stockLevel?: number; minThreshold?: number; costPerUnit?: number }, @Req() req: any) {
    return this.inventoryService.updateInventoryItem(id, data, req.user.id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO')
  deleteInventoryItem(@Param('id') id: string, @Req() req: any) {
    return this.inventoryService.deleteInventoryItem(id, req.user?.id);
  }

  @Patch(':id/stock')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'CASHIER')
  updateStock(@Param('id') id: string, @Body('amount') amount: number, @Req() req: any) {
    return this.inventoryService.updateStock(id, amount, req.user.id);
  }

  @Post(':id/transfer')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'CASHIER')
  transferStock(
    @Param('id') id: string,
    @Body() data: { from: string, to: string, amount: number },
    @Req() req: any
  ) {
    return this.inventoryService.transferStock(id, data, req.user.id);
  }

  @Post('recipes')
  addRecipeIngredient(@Body() data: { menuItemId: string; inventoryItemId: string; quantity: number }) {
    return this.inventoryService.addRecipeIngredient(data);
  }
}


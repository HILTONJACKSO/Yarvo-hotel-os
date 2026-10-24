import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Inventory')
@ApiCookieAuth('accessToken')
@Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'CASHIER', 'POS', 'POS_CASHIER', 'INVENTORY_MANAGER', 'STOREKEEPER', 'SUPERVISOR', 'BARTENDER', 'WAITER')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  getInventoryItems(@Req() req: any) {
    return this.inventoryService.getInventoryItems(req.user?.propertyId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'INVENTORY_MANAGER', 'STOREKEEPER')
  createInventoryItem(@Body() data: { name: string; category?: string; unit: string; stockLevel?: number; minThreshold?: number; costPerUnit?: number }, @Req() req: any) {
    return this.inventoryService.createInventoryItem(data, req.user?.id, req.user?.propertyId);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'INVENTORY_MANAGER', 'STOREKEEPER')
  updateInventoryItem(@Param('id') id: string, @Body() data: { name: string; category?: string; unit: string; stockLevel?: number; minThreshold?: number; costPerUnit?: number }, @Req() req: any) {
    return this.inventoryService.updateInventoryItem(id, data, req.user?.id, req.user?.propertyId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  deleteInventoryItem(@Param('id') id: string, @Req() req: any) {
    return this.inventoryService.deleteInventoryItem(id, req.user?.id);
  }

  @Patch(':id/stock')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'CASHIER', 'INVENTORY_MANAGER', 'STOREKEEPER')
  updateStock(@Param('id') id: string, @Body('amount') amount: number, @Req() req: any) {
    return this.inventoryService.updateStock(id, amount, req.user?.id);
  }

  @Post(':id/transfer')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'CASHIER', 'INVENTORY_MANAGER', 'STOREKEEPER', 'SUPERVISOR', 'BARTENDER', 'POS', 'POS_CASHIER')
  transferStock(
    @Param('id') id: string,
    @Body() data: { from: string, to: string, amount: number },
    @Req() req: any
  ) {
    return this.inventoryService.transferStock(id, data, req.user?.id);
  }

  @Post(':id/stock-in')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'INVENTORY_MANAGER', 'STOREKEEPER', 'SUPERVISOR', 'CASHIER', 'FRONT_DESK', 'BARTENDER', 'POS', 'POS_CASHIER')
  stockIn(@Param('id') id: string, @Body() data: { amount: number, costPerUnit?: number }, @Req() req: any) {
    return this.inventoryService.stockIn(id, data, req.user?.id);
  }

  @Post(':id/stock-out')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'INVENTORY_MANAGER', 'STOREKEEPER', 'SUPERVISOR', 'CASHIER', 'FRONT_DESK', 'BARTENDER', 'WAITER', 'POS', 'POS_CASHIER')
  stockOut(@Param('id') id: string, @Body() data: { amount: number, staffName: string, reason?: string, location?: string }, @Req() req: any) {
    return this.inventoryService.stockOut(id, data, req.user?.id);
  }

  @Post('recipes')
  addRecipeIngredient(@Body() data: { menuItemId: string; inventoryItemId: string; quantity: number }) {
    return this.inventoryService.addRecipeIngredient(data);
  }
}

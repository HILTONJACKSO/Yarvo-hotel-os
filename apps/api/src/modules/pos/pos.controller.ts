import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PosService } from './pos.service';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('POS')
@ApiCookieAuth('accessToken')
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('tables')
  getTables() {
    return this.posService.getTables();
  }

  @Post('tables')
  @Roles('SUPER_ADMIN', 'MANAGER')
  createTable(@Body() data: { number: string; capacity: number }) {
    return this.posService.createTable(data);
  }

  @Delete('tables/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  deleteTable(@Param('id') id: string) {
    return this.posService.deleteTable(id);
  }

  @Get('categories')
  getCategories() {
    return this.posService.getCategories();
  }

  @Post('categories')
  @Roles('SUPER_ADMIN', 'MANAGER')
  createCategory(@Body() data: { name: string }) {
    return this.posService.createCategory(data);
  }

  @Get('menu-items')
  getMenuItems() {
    return this.posService.getMenuItems();
  }

  @Post('menu-items')
  @Roles('SUPER_ADMIN', 'MANAGER')
  createMenuItem(@Body() data: { categoryId: string; name: string; description?: string; price: number; type?: string; inventoryItemId?: string; image?: string; taxIds?: string[] }) {
    return this.posService.createMenuItem(data);
  }

  @Get('orders')
  getActiveOrders() {
    return this.posService.getActiveOrders();
  }

  @Get('ready-items')
  getReadyOrderItems() {
    return this.posService.getReadyOrderItems();
  }

  @Get('served-orders')
  getServedOrders() {
    return this.posService.getServedOrders();
  }

  @Post('orders')
  createOrder(@Body() data: { tableId?: string; folioId?: string }) {
    return this.posService.createOrder(data);
  }

  @Post('orders/:id/items')
  addOrderItem(@Param('id') id: string, @Body() data: { menuItemId: string; quantity: number; notes?: string }) {
    return this.posService.addOrderItem(id, data);
  }

  @Patch('order-items/:itemId/status')
  updateOrderItemStatus(@Param('itemId') itemId: string, @Body('status') status: string) {
    return this.posService.updateOrderItemStatus(itemId, status);
  }

  @Post('orders/:id/checkout')
  checkoutOrder(@Param('id') id: string, @Body() data: { payments?: { method: string; amount: number }[], folioId?: string }) {
    return this.posService.checkoutOrder(id, data);
  }
}


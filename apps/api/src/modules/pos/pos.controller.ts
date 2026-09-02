import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
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

  @Patch('categories/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  updateCategory(@Param('id') id: string, @Body() data: { name: string }) {
    return this.posService.updateCategory(id, data);
  }

  @Delete('categories/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  deleteCategory(@Param('id') id: string) {
    return this.posService.deleteCategory(id);
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

  @Patch('menu-items/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  updateMenuItem(@Param('id') id: string, @Body() data: { categoryId?: string; name?: string; description?: string; price?: number; type?: string; inventoryItemId?: string; image?: string; taxIds?: string[] }) {
    return this.posService.updateMenuItem(id, data);
  }

  @Delete('menu-items/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  deleteMenuItem(@Param('id') id: string) {
    return this.posService.deleteMenuItem(id);
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
  createOrder(@Body() data: { tableId?: string; folioId?: string; discountAmount?: number; notes?: string }, @Req() req: any) {
    return this.posService.createOrder({ ...data, userId: req.user.id });
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
  checkoutOrder(@Param('id') id: string, @Body() data: { payments?: { method: string; amount: number }[], folioId?: string, discountAmount?: number }) {
    return this.posService.checkoutOrder(id, data);
  }

  // --- Return Workflow ---
  @Post('order-items/:itemId/return-request')
  requestReturn(@Param('itemId') itemId: string, @Req() req: any) {
    return this.posService.requestReturn(itemId, req.user.id);
  }

  @Get('returns')
  @Roles('SUPER_ADMIN', 'MANAGER', 'KITCHEN', 'BAR', 'WAITSTAFF')
  getReturnRequests() {
    return this.posService.getReturnRequests();
  }

  @Post('returns/:returnId/confirm')
  @Roles('SUPER_ADMIN', 'MANAGER', 'KITCHEN', 'BAR')
  confirmReturn(@Param('returnId') returnId: string, @Body('kitchenNote') kitchenNote: string, @Req() req: any) {
    return this.posService.confirmReturn(returnId, req.user.id, kitchenNote);
  }

  @Post('returns/:returnId/approve')
  @Roles('SUPER_ADMIN', 'MANAGER')
  approveReturn(@Param('returnId') returnId: string, @Body('approved') approved: boolean, @Req() req: any) {
    return this.posService.approveReturn(returnId, req.user.id, approved);
  }
}


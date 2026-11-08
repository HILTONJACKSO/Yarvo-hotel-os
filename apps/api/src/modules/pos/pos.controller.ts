import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { PosService } from './pos.service';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('POS')
@ApiCookieAuth('accessToken')
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('tables')
  getTables(@Req() req: any) {
    return this.posService.getTables(req.user?.propertyId);
  }

  @Post('tables')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  createTable(@Body() data: { number: string; capacity: number }, @Req() req: any) {
    return this.posService.createTable(data, req.user?.propertyId);
  }

  @Delete('tables/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  deleteTable(@Param('id') id: string) {
    return this.posService.deleteTable(id);
  }

  @Get('categories')
  getCategories(@Req() req: any) {
    return this.posService.getCategories(req.user?.propertyId);
  }

  @Post('categories')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  createCategory(@Body() data: { name: string }, @Req() req: any) {
    return this.posService.createCategory(data, req.user?.propertyId);
  }

  @Patch('categories/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  updateCategory(@Param('id') id: string, @Body() data: { name: string }, @Req() req: any) {
    return this.posService.updateCategory(id, data, req.user.id);
  }

  @Delete('categories/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  deleteCategory(@Param('id') id: string) {
    return this.posService.deleteCategory(id);
  }

  @Get('menu-items')
  getMenuItems(@Req() req: any) {
    return this.posService.getMenuItems(req.user?.propertyId);
  }

  @Post('menu-items')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  createMenuItem(@Body() data: { categoryId: string; name: string; description?: string; price: number; type?: string; inventoryItemId?: string; image?: string; images?: string[]; taxIds?: string[] }) {
    return this.posService.createMenuItem(data);
  }

  @Patch('menu-items/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  updateMenuItem(@Param('id') id: string, @Body() data: { categoryId?: string; name?: string; description?: string; price?: number; type?: string; inventoryItemId?: string; image?: string; images?: string[]; taxIds?: string[] }, @Req() req: any) {
    return this.posService.updateMenuItem(id, data, req.user.id);
  }

  @Delete('menu-items/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  deleteMenuItem(@Param('id') id: string) {
    return this.posService.deleteMenuItem(id);
  }

  @Get('stats/kitchen')
  getKitchenStats(@Req() req: any) {
    return this.posService.getDailyDepartmentStats('FOOD', req.user?.propertyId);
  }

  @Get('stats/bar')
  getBarStats(@Req() req: any) {
    return this.posService.getDailyDepartmentStats('DRINK', req.user?.propertyId);
  }

  @Get('stats/waitstaff')
  getWaitstaffStats(@Req() req: any) {
    return this.posService.getDailyWaitstaffStats(req.user.id);
  }

  @Get('stats/cashier')
  getCashierStats(@Req() req: any) {
    return this.posService.getDailyCashierStats(req.user?.propertyId);
  }

    @Post('orders/transfer')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'CASHIER', 'WAITSTAFF')
  transferItems(@Body() data: {
    sourceOrderId: string;
    targetTableId?: string;
    targetOrderId?: string;
    items: { id: string; quantity: number }[];
  }) {
    return this.posService.transferItems(data);
  }
  @Get('orders')
  getActiveOrders(@Req() req: any) {
    return this.posService.getActiveOrders(req.user?.propertyId);
  }

  @Get('ready-items')
  getReadyOrderItems(@Req() req: any) {
    return this.posService.getReadyOrderItems(req.user?.propertyId);
  }

  @Get('served-orders')
  getServedOrders(@Req() req: any) {
    return this.posService.getServedOrders(req.user?.propertyId);
  }

  @Post('orders')
  createOrder(
    @Body()
    data: {
      tableId?: string;
      folioId?: string;
      guestId?: string;
      discountAmount?: number;
      discountReason?: string;
      notes?: string;
      clientRequestId?: string;
      items?: Array<{ menuItemId: string; quantity: number; notes?: string }>;
    },
    @Req() req: any,
  ) {
    return this.posService.createOrder({
      ...data,
      userId: req.user.id,
      userRoles: req.user.roles,
      propertyId: req.user?.propertyId,
    });
  }

  @Post('orders/:id/items')
  addOrderItem(
    @Param('id') id: string,
    @Body() data: { menuItemId: string; quantity: number; notes?: string; clientRequestId?: string },
  ) {
    return this.posService.addOrderItem(id, data);
  }

  @Patch('order-items/:itemId/status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR', 'KITCHEN', 'KITCHEN_CHEF', 'BAR', 'WAITSTAFF', 'STAFF_WAITER', 'CASHIER', 'POS_CASHIER', 'FRONT_DESK')
  updateOrderItemStatus(@Param('itemId') itemId: string, @Body() body: any) {
    const status = typeof body === 'object' && body?.status ? body.status : (body || 'READY');
    return this.posService.updateOrderItemStatus(itemId, status);
  }

  @Post('orders/:id/deliver-all')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR', 'WAITSTAFF', 'STAFF_WAITER', 'CASHIER', 'POS_CASHIER')
  deliverAllOrderItems(@Param('id') id: string) {
    return this.posService.deliverAllOrderItems(id);
  }

  @Post('orders/:id/checkout')
  checkoutOrder(@Param('id') id: string, @Body() data: { payments?: { method: string; amount: number }[], folioId?: string, discountAmount?: number, discountReason?: string }) {
    return this.posService.checkoutOrder(id, data);
  }

  @Post('orders/:id/apply-discount')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'CASHIER', 'POS_CASHIER')
  applyDiscount(
    @Param('id') id: string,
    @Body() data: { amount: number; value: number; type: 'PERCENT' | 'FLAT'; reason?: string },
    @Req() req: any
  ) {
    const roles = req.user?.roles || (req.user?.role ? [req.user.role] : []);
    return this.posService.applyDiscount(id, data, req.user?.id, roles);
  }

  @Post('orders/:id/reverse-discount')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  reverseDiscount(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const roles = req.user?.roles || (req.user?.role ? [req.user.role] : []);
    return this.posService.reverseDiscount(id, req.user?.id, roles);
  }

  @Post('orders/:id/increment-print')
  incrementInvoicePrint(@Param('id') id: string) {
    return this.posService.incrementInvoicePrint(id);
  }

  @Post('orders/:id/increment-receipt-print')
  incrementReceiptPrint(@Param('id') id: string) {
    return this.posService.incrementReceiptPrint(id);
  }

  @Delete('orders/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'CASHIER')
  deleteOrder(@Param('id') id: string) {
    return this.posService.deleteOrder(id);
  }

  // --- Return Workflow ---
  @Post('order-items/:itemId/return-request')
  requestReturn(
    @Param('itemId') itemId: string,
    @Body() body: { reason?: string; quantity?: number; note?: string },
    @Req() req: any
  ) {
    return this.posService.requestReturn(itemId, req.user.id, body?.reason, body?.quantity, body?.note);
  }

  @Get('returns')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR', 'KITCHEN', 'KITCHEN_CHEF', 'BAR', 'WAITSTAFF', 'STAFF_WAITER', 'CASHIER', 'POS_CASHIER', 'FRONT_DESK')
  getReturnRequests(@Query('start') start?: string, @Query('end') end?: string) {
    return this.posService.getReturnRequests(start, end);
  }


  @Post('order-items/:itemId/confirm-return')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR', 'KITCHEN', 'KITCHEN_CHEF', 'BAR', 'CASHIER', 'POS_CASHIER', 'FRONT_DESK')
  confirmReturnByItemId(@Param('itemId') itemId: string, @Body('kitchenNote') kitchenNote: string, @Req() req: any) {
    return this.posService.confirmReturnByItemId(itemId, req.user.id, kitchenNote);
  }

  @Post('returns/:returnId/confirm')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR', 'KITCHEN', 'KITCHEN_CHEF', 'BAR', 'CASHIER', 'POS_CASHIER', 'FRONT_DESK')
  confirmReturn(@Param('returnId') returnId: string, @Body('kitchenNote') kitchenNote: string, @Req() req: any) {
    return this.posService.confirmReturn(returnId, req.user.id, kitchenNote);
  }

  @Post('returns/:returnId/approve')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR', 'CASHIER', 'FRONT_DESK')
  approveReturn(@Param('returnId') returnId: string, @Body('approved') approved: boolean, @Req() req: any) {
    return this.posService.approveReturn(returnId, req.user.id, approved);
  }

  @Post('order-items/:itemId/approve-return')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR', 'CASHIER', 'FRONT_DESK')
  approveReturnByItemId(@Param('itemId') itemId: string, @Body('approved') approved: boolean, @Req() req: any) {
    return this.posService.approveReturnByItemId(itemId, req.user.id, approved);
  }
}




import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
} from '@nestjs/common';
import { FoliosService } from './folios.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateLineItemDto } from './dto/update-line-item.dto';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Folios & Billing')
@ApiCookieAuth('accessToken')
@Controller('folios')
export class FoliosController {
  constructor(private readonly foliosService: FoliosService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'List all folios' })
  getAllFolios(@Query('status') status?: 'OPEN' | 'CLOSED') {
    return this.foliosService.getAllFolios(status);
  }

  @Get(':id/statement')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'Get a full folio statement with all line items' })
  getStatement(@Param('id') id: string) {
    return this.foliosService.getStatement(id);
  }

  @Post(':id/charges')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'Post a new charge to a folio' })
  postCharge(
    @Param('id') id: string,
    @Body() createChargeDto: CreateChargeDto,
    @Req() req: any,
  ) {
    return this.foliosService.postCharge(id, createChargeDto, req.user?.id);
  }

  @Post(':id/payments')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'Post a payment to a folio' })
  postPayment(
    @Param('id') id: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: any,
  ) {
    return this.foliosService.postPayment(id, createPaymentDto, req.user?.id);
  }

  @Post(':id/close')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'Close a folio manually' })
  closeFolio(@Param('id') id: string, @Req() req: any) {
    return this.foliosService.closeFolio(id, req.user?.id);
  }

  @Post(':id/discount')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'Post a discount to a folio' })
  postDiscount(
    @Param('id') id: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: any,
  ) {
    return this.foliosService.postDiscount(id, createPaymentDto, req.user?.id);
  }

  @Patch(':id/items/:itemId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'Update a line item in a folio (amount, description, category)' })
  updateLineItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateLineItemDto: UpdateLineItemDto,
    @Req() req: any,
  ) {
    return this.foliosService.updateLineItem(id, itemId, updateLineItemDto, req.user?.id);
  }

  @Delete(':id/items/:itemId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'Delete a line item from a folio' })
  deleteLineItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Req() req: any,
  ) {
    return this.foliosService.deleteLineItem(id, itemId, req.user?.id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'Delete a folio and its line items' })
  deleteFolio(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.foliosService.deleteFolio(id, req.user?.id);
  }
}
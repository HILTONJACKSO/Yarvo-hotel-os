import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Query,
} from '@nestjs/common';
import { FoliosService } from './folios.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Folios & Billing')
@ApiCookieAuth('accessToken')
@Controller('folios')
export class FoliosController {
  constructor(private readonly foliosService: FoliosService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK', 'ACCOUNTING')
  @ApiOperation({ summary: 'List all folios' })
  getAllFolios(@Query('status') status?: 'OPEN' | 'CLOSED') {
    return this.foliosService.getAllFolios(status);
  }

  @Get(':id/statement')
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK', 'ACCOUNTING')
  @ApiOperation({ summary: 'Get a full folio statement with all line items' })
  getStatement(@Param('id') id: string) {
    return this.foliosService.getStatement(id);
  }

  @Post(':id/charges')
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK', 'ACCOUNTING')
  @ApiOperation({ summary: 'Post a new charge to a folio' })
  postCharge(
    @Param('id') id: string,
    @Body() createChargeDto: CreateChargeDto,
    @Req() req: any,
  ) {
    return this.foliosService.postCharge(id, createChargeDto, req.user?.id);
  }

  @Post(':id/payments')
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK', 'ACCOUNTING')
  @ApiOperation({ summary: 'Post a payment to a folio' })
  postPayment(
    @Param('id') id: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: any,
  ) {
    return this.foliosService.postPayment(id, createPaymentDto, req.user?.id);
  }
}


import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Work Orders')
@ApiCookieAuth('accessToken')
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'HOUSEKEEPING', 'MAINTENANCE')
  @ApiOperation({ summary: 'List all work orders' })
  findAll() {
    return this.workOrdersService.findAll();
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'HOUSEKEEPING', 'MAINTENANCE', 'FRONT_DESK')
  @ApiOperation({ summary: 'Create a new work order' })
  create(@Body() createDto: CreateWorkOrderDto, @Req() req: any) {
    return this.workOrdersService.create(createDto, req.user?.id);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'HOUSEKEEPING', 'MAINTENANCE')
  @ApiOperation({ summary: 'Update work order status' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkOrderStatusDto,
  ) {
    return this.workOrdersService.updateStatus(id, updateDto);
  }
}


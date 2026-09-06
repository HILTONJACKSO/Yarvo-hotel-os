import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'CASHIER', 'TICKETING_STAFF')
  async create(@Body() createTicketDto: CreateTicketDto, @CurrentUser() user: any) {
    const data = await this.ticketsService.create(createTicketDto, user.id);
    return { message: 'Ticket issued successfully', data };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'CASHIER', 'TICKETING_STAFF')
  async findAll() {
    const data = await this.ticketsService.findAll();
    return { data };
  }

    @Patch(':id/use')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'CASHIER', 'TICKETING_STAFF')
  async markAsUsed(@Param('id') id: string) {
    const data = await this.ticketsService.markAsUsed(id);
    return { message: 'Ticket marked as used', data };
  }

  @Patch(':id/return')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'CASHIER', 'TICKETING_STAFF')
  async markAsReturned(@Param('id') id: string) {
    const data = await this.ticketsService.markAsReturned(id);
    return { message: 'Ticket returned successfully', data };
  }

}

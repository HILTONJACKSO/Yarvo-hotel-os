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
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK')
  async create(@Body() createTicketDto: CreateTicketDto, @CurrentUser() user: any) {
    const data = await this.ticketsService.create(createTicketDto, user.id);
    return { message: 'Ticket issued successfully', data };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK')
  async findAll() {
    const data = await this.ticketsService.findAll();
    return { data };
  }

  @Patch(':id/use')
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK')
  async markAsUsed(@Param('id') id: string) {
    const data = await this.ticketsService.markAsUsed(id);
    return { message: 'Ticket marked as used', data };
  }

  // --- Ticket Tiers ---

  @Get('tiers')
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK')
  async getTiers() {
    const data = await this.ticketsService.getTiers();
    return { data };
  }

  @Post('tiers')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async createTier(@Body() body: { name: string; price: number }) {
    const data = await this.ticketsService.createTier(body);
    return { message: 'Ticket tier created successfully', data };
  }

  @Delete('tiers/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async deleteTier(@Param('id') id: string) {
    const data = await this.ticketsService.deleteTier(id);
    return { message: 'Ticket tier deleted', data };
  }
}


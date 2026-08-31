import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventSpaceDto, UpdateEventSpaceDto, CreateEventBookingDto, UpdateEventBookingDto } from './dto/event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // Event Spaces
  @Get('spaces')
  getSpaces() {
    return this.eventsService.getSpaces();
  }

  @Get('spaces/:id')
  getSpace(@Param('id') id: string) {
    return this.eventsService.getSpace(id);
  }

  @Post('spaces')
  createSpace(@Body() data: CreateEventSpaceDto) {
    return this.eventsService.createSpace(data);
  }

  @Put('spaces/:id')
  updateSpace(@Param('id') id: string, @Body() data: UpdateEventSpaceDto) {
    return this.eventsService.updateSpace(id, data);
  }

  @Delete('spaces/:id')
  deleteSpace(@Param('id') id: string) {
    return this.eventsService.deleteSpace(id);
  }

  // Event Bookings
  @Get('bookings')
  getBookings() {
    return this.eventsService.getBookings();
  }

  @Get('bookings/:id')
  getBooking(@Param('id') id: string) {
    return this.eventsService.getBooking(id);
  }

  @Post('bookings')
  createBooking(@Body() data: CreateEventBookingDto) {
    return this.eventsService.createBooking(data);
  }

  @Put('bookings/:id')
  updateBooking(@Param('id') id: string, @Body() data: UpdateEventBookingDto) {
    return this.eventsService.updateBooking(id, data);
  }

  @Delete('bookings/:id')
  deleteBooking(@Param('id') id: string) {
    return this.eventsService.deleteBooking(id);
  }
}


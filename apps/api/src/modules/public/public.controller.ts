import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public Integrations')
@ApiHeader({
  name: 'X-API-Key',
  description: 'Required API Key for public integrations',
  required: true,
})
@Public() // Bypasses the JWT auth guard
@UseGuards(ApiKeyGuard) // Applies the API Key guard instead
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('room-types')
  @ApiOperation({ summary: 'Get all active room types and base rates' })
  @ApiResponse({ status: 200, description: 'List of room types.' })
  async getRoomTypes() {
    return { data: await this.publicService.getRoomTypes() };
  }

  @Get('availability')
  @ApiOperation({ summary: 'Check real-time room availability' })
  @ApiQuery({ name: 'checkIn', example: '2027-01-01' })
  @ApiQuery({ name: 'checkOut', example: '2027-01-05' })
  @ApiQuery({ name: 'adults', example: 2, type: Number })
  @ApiResponse({ status: 200, description: 'Available room types and room counts.' })
  async checkAvailability(
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @Query('adults') adults: string,
  ) {
    const adultsCount = parseInt(adults, 10) || 1;
    return { data: await this.publicService.checkAvailability(checkIn, checkOut, adultsCount) };
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Submit a new direct booking from website' })
  @ApiResponse({ status: 201, description: 'Booking successfully created in PENDING state.' })
  async createBooking(@Body() createBookingDto: CreateBookingDto) {
    return { data: await this.publicService.createBooking(createBookingDto) };
  }

  @Get('menu')
  @ApiOperation({ summary: 'Get active POS digital menu items' })
  @ApiResponse({ status: 200, description: 'Categorized digital menu items.' })
  async getMenu() {
    return { data: await this.publicService.getDigitalMenu() };
  }
}

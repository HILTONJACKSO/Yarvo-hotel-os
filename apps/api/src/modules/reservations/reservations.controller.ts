import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReservationStatus } from '@prisma/client';

@ApiTags('Reservations')
@ApiCookieAuth('accessToken')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Create a new reservation' })
  create(@Body() createReservationDto: CreateReservationDto, @Req() req: any) {
    return this.reservationsService.create(createReservationDto, req.user?.id);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTING')
  @ApiOperation({ summary: 'List and filter reservations' })
  @ApiQuery({ name: 'status', enum: ReservationStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: ReservationStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.reservationsService.findAll(status, page, limit);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTING')
  @ApiOperation({ summary: 'Get a specific reservation' })
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Update reservation status (e.g., Check-In)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateReservationStatusDto,
    @Req() req: any,
  ) {
    return this.reservationsService.updateStatus(id, updateDto, req.user?.id);
  }

  @Post(':id/check-in')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Execute full Check-In workflow' })
  checkIn(@Param('id') id: string, @Body() checkInDto: CheckInDto, @Req() req: any) {
    return this.reservationsService.checkIn(id, checkInDto.roomId, req.user?.id);
  }

  @Post(':id/check-out')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Execute full Check-Out workflow' })
  checkOut(@Param('id') id: string, @Body() checkOutDto: CheckOutDto, @Req() req: any) {
    return this.reservationsService.checkOut(id, checkOutDto, req.user?.id);
  }
}


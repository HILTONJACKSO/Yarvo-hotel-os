import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Req,
  BadRequestException
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { ChangeRoomStatusDto } from './dto/change-status.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoomStatus } from '@prisma/client';

@ApiTags('Rooms')
@ApiCookieAuth('accessToken')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO')
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room successfully created.' })
  @ApiResponse({ status: 400, description: 'RoomType not found.' })
  @ApiResponse({ status: 409, description: 'Room number already exists.' })
  create(@Body() createRoomDto: CreateRoomDto, @CurrentUser() user: any) {
    return this.roomsService.create(createRoomDto, user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all rooms' })
  @ApiQuery({ name: 'status', enum: RoomStatus, required: false })
  @ApiQuery({ name: 'floor', type: Number, required: false })
  @ApiQuery({ name: 'roomTypeId', type: String, required: false })
  @ApiResponse({ status: 200, description: 'List of rooms.' })
  findAll(
    @Query('status') status?: RoomStatus,
    @Query('floor') floor?: string,
    @Query('roomTypeId') roomTypeId?: string,
  ) {
    return this.roomsService.findAll(
      status,
      floor ? parseInt(floor, 10) : undefined,
      roomTypeId,
    );
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get room calendar with overlapping reservations' })
  @ApiQuery({ name: 'start', type: String, required: true })
  @ApiQuery({ name: 'end', type: String, required: true })
  getCalendar(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    if (!start || !end) {
      throw new BadRequestException('start and end dates are required');
    }
    return this.roomsService.getRoomCalendar(start, end);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific room by ID' })
  @ApiResponse({ status: 200, description: 'The room.' })
  @ApiResponse({ status: 404, description: 'Room not found.' })
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO')
  @ApiOperation({ summary: 'Update a room details' })
  @ApiResponse({ status: 200, description: 'Room successfully updated.' })
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto, @CurrentUser() user: any) {
    return this.roomsService.update(id, updateRoomDto, user?.id);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING')
  @ApiOperation({ summary: 'Change a room status (writes to history)' })
  @ApiResponse({ status: 200, description: 'Room status successfully updated.' })
  changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeRoomStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.roomsService.changeStatus(id, changeStatusDto, user.id);
  }

  @Patch(':id/clean')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'HOUSEKEEPING')
  @ApiOperation({ summary: 'Mark a dirty room as clean (AVAILABLE)' })
  markAsClean(@Param('id') id: string, @Req() req: any) {
    return this.roomsService.changeStatus(
      id, 
      { status: 'AVAILABLE', reason: 'Room cleaned by housekeeping' }, 
      req.user?.id
    );
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a room' })
  @ApiResponse({ status: 204, description: 'Room successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}


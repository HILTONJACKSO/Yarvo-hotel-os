import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Room Types')
@ApiCookieAuth('accessToken')
@Controller('room-types')
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new room type' })
  @ApiResponse({ status: 201, description: 'Room type successfully created.' })
  @ApiResponse({ status: 409, description: 'Room type with this code already exists.' })
  create(@Body() createRoomTypeDto: CreateRoomTypeDto) {
    return this.roomTypesService.create(createRoomTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active room types' })
  @ApiResponse({ status: 200, description: 'List of room types.' })
  findAll() {
    return this.roomTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific room type by ID' })
  @ApiResponse({ status: 200, description: 'The room type.' })
  @ApiResponse({ status: 404, description: 'Room type not found.' })
  findOne(@Param('id') id: string) {
    return this.roomTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a room type' })
  @ApiResponse({ status: 200, description: 'Room type successfully updated.' })
  @ApiResponse({ status: 404, description: 'Room type not found.' })
  update(@Param('id') id: string, @Body() updateRoomTypeDto: UpdateRoomTypeDto) {
    return this.roomTypesService.update(id, updateRoomTypeDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a room type' })
  @ApiResponse({ status: 204, description: 'Room type successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Room type not found.' })
  remove(@Param('id') id: string) {
    return this.roomTypesService.remove(id);
  }
}


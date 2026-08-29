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
  DefaultValuePipe,
} from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Guests')
@ApiCookieAuth('accessToken')
@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Create a new guest profile' })
  @ApiResponse({ status: 201, description: 'Guest successfully created.' })
  @ApiResponse({ status: 409, description: 'Guest email already exists.' })
  create(@Body() createGuestDto: CreateGuestDto) {
    return this.guestsService.create(createGuestDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'ACCOUNTING')
  @ApiOperation({ summary: 'List and search guests' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, email, or phone' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.guestsService.findAll(search, page, limit);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Get a specific guest by ID' })
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Update a guest profile' })
  update(@Param('id') id: string, @Body() updateGuestDto: UpdateGuestDto) {
    return this.guestsService.update(id, updateGuestDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a guest' })
  remove(@Param('id') id: string) {
    return this.guestsService.remove(id);
  }
}


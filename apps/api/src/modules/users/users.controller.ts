import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiCookieAuth('accessToken')
@Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('roles')
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    const data = await this.usersService.create(createUserDto, req.user);
    return { data, message: 'User created successfully' };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    const data = await this.usersService.update(id, updateUserDto, req.user);
    return { data, message: 'User updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.usersService.remove(id);
    return { data, message: 'User deactivated successfully' };
  }
}


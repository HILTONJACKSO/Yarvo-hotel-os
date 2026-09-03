const fs = require('fs');
const path = require('path');

const usersControllerPath = path.join('apps', 'api', 'src', 'modules', 'users', 'users.controller.ts');
let usersControllerStr = fs.readFileSync(usersControllerPath, 'utf8');

usersControllerStr = usersControllerStr.replace(
  "import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';",
  "import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';\nimport { ApiTags, ApiCookieAuth } from '@nestjs/swagger';\nimport { Roles } from '../../common/decorators/roles.decorator';"
);

usersControllerStr = usersControllerStr.replace(
  "@Controller('users')",
  "@ApiTags('Users')\n@ApiCookieAuth('accessToken')\n@Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')\n@Controller('users')"
);

usersControllerStr = usersControllerStr.replace(
  "async create(@Body() createUserDto: CreateUserDto) {\n    const data = await this.usersService.create(createUserDto);",
  "async create(@Body() createUserDto: CreateUserDto, @Req() req: any) {\n    const data = await this.usersService.create(createUserDto, req.user);"
);

usersControllerStr = usersControllerStr.replace(
  "async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {\n    const data = await this.usersService.update(id, updateUserDto);",
  "async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {\n    const data = await this.usersService.update(id, updateUserDto, req.user);"
);

fs.writeFileSync(usersControllerPath, usersControllerStr);

const usersServicePath = path.join('apps', 'api', 'src', 'modules', 'users', 'users.service.ts');
let usersServiceStr = fs.readFileSync(usersServicePath, 'utf8');

usersServiceStr = usersServiceStr.replace(
  "import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';",
  "import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';"
);

const createCheck = `  async create(createUserDto: CreateUserDto, currentUser?: any) {
    if (currentUser?.roles?.includes('MANAGER') && !currentUser?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r))) {
      const assigningRoles = await this.prisma.role.findMany({
        where: { id: { in: createUserDto.roleIds } }
      });
      const hasRestrictedRole = assigningRoles.some(r => ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER'].includes(r.name));
      if (hasRestrictedRole) {
        throw new ForbiddenException('Managers are not permitted to assign SUPER_ADMIN, ADMIN, CEO, or MANAGER roles.');
      }
    }`;

usersServiceStr = usersServiceStr.replace(
  "async create(createUserDto: CreateUserDto) {",
  createCheck
);

const updateCheck = `  async update(id: string, updateUserDto: UpdateUserDto, currentUser?: any) {
    if (updateUserDto.roleIds && currentUser?.roles?.includes('MANAGER') && !currentUser?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r))) {
      const assigningRoles = await this.prisma.role.findMany({
        where: { id: { in: updateUserDto.roleIds } }
      });
      const hasRestrictedRole = assigningRoles.some(r => ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER'].includes(r.name));
      if (hasRestrictedRole) {
        throw new ForbiddenException('Managers are not permitted to assign SUPER_ADMIN, ADMIN, CEO, or MANAGER roles.');
      }
    }`;

usersServiceStr = usersServiceStr.replace(
  "async update(id: string, updateUserDto: UpdateUserDto) {",
  updateCheck
);

fs.writeFileSync(usersServicePath, usersServiceStr);

console.log("Updated users controller and service.");

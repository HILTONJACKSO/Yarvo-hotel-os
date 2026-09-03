import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        isLocked: true,
        createdAt: true,
        roles: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
  }

    async create(createUserDto: CreateUserDto, currentUser?: any) {
    if (currentUser?.roles?.includes('MANAGER') && !currentUser?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r))) {
      const assigningRoles = await this.prisma.role.findMany({
        where: { id: { in: createUserDto.roleIds } }
      });
      const hasRestrictedRole = assigningRoles.some(r => ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER'].includes(r.name));
      if (hasRestrictedRole) {
        throw new ForbiddenException('Managers are not permitted to assign SUPER_ADMIN, ADMIN, CEO, or MANAGER roles.');
      }
    }
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await argon2.hash(createUserDto.password);

    return this.prisma.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        passwordHash,
        roles: { connect: createUserDto.roleIds.map((id) => ({ id })) },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roles: true,
      }
    });
  }

    async update(id: string, updateUserDto: UpdateUserDto, currentUser?: any) {
    if (updateUserDto.roleIds && currentUser?.roles?.includes('MANAGER') && !currentUser?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r))) {
      const assigningRoles = await this.prisma.role.findMany({
        where: { id: { in: updateUserDto.roleIds } }
      });
      const hasRestrictedRole = assigningRoles.some(r => ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER'].includes(r.name));
      if (hasRestrictedRole) {
        throw new ForbiddenException('Managers are not permitted to assign SUPER_ADMIN, ADMIN, CEO, or MANAGER roles.');
      }
    }
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        email: updateUserDto.email,
        isActive: updateUserDto.isActive,
        ...(updateUserDto.roleIds && {
          roles: { set: updateUserDto.roleIds.map((id) => ({ id })) },
        }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        roles: true,
      }
    });
  }

  async remove(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  // Record a login attempt for brute force protection
  async recordLoginAttempt(email: string, ipAddress: string, success: boolean) {
    await this.prisma.loginAttempt.create({
      data: {
        email,
        ipAddress,
        success,
      },
    });

    if (!success) {
      const recentFailedAttempts = await this.prisma.loginAttempt.count({
        where: {
          email,
          success: false,
          timestamp: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // last 15 minutes
          },
        },
      });

      if (recentFailedAttempts >= 5) {
        await this.prisma.user.update({
          where: { email },
          data: { isLocked: true },
        });
      }
    } else {
      await this.prisma.user.update({
        where: { email },
        data: { isLocked: false },
      });
    }
  }

  // Manage Sessions
  async createSession(userId: string, refreshTokenHash: string, ipAddress: string, userAgent: string, expiresAt: Date) {
    return this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });
  }

  async findSession(id: string) {
    return this.prisma.session.findUnique({
      where: { id },
      include: { user: { include: { roles: true } } },
    });
  }

  async revokeSession(id: string) {
    return this.prisma.session.deleteMany({
      where: { id },
    });
  }
}


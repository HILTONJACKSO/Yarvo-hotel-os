import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGuestDto: CreateGuestDto) {
    if (createGuestDto.email) {
      const existing = await this.prisma.guest.findUnique({
        where: { email: createGuestDto.email },
      });
      if (existing) {
        throw new ConflictException(`Guest with email ${createGuestDto.email} already exists`);
      }
    }

    return this.prisma.guest.create({
      data: createGuestDto,
    });
  }

  async findAll(search?: string, page: number = 1, limit: number = 50) {
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lastName: 'asc' },
      }),
      this.prisma.guest.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
    });

    if (!guest || !guest.isActive) {
      throw new NotFoundException(`Guest with ID ${id} not found`);
    }

    return guest;
  }

  async update(id: string, updateGuestDto: UpdateGuestDto) {
    await this.findOne(id);

    if (updateGuestDto.email) {
      const existing = await this.prisma.guest.findFirst({
        where: { email: updateGuestDto.email, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Guest with email ${updateGuestDto.email} already exists`);
      }
    }

    return this.prisma.guest.update({
      where: { id },
      data: updateGuestDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.guest.update({
      where: { id },
      data: { isActive: false },
    });
  }
}


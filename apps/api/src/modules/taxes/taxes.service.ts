import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/tax.dto';

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(propertyId: string) {
    return this.prisma.tax.findMany({
      where: { propertyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, propertyId: string) {
    const tax = await this.prisma.tax.findFirst({
      where: { id, propertyId },
    });
    if (!tax) throw new NotFoundException('Tax not found');
    return tax;
  }

  async create(propertyId: string, data: CreateTaxDto) {
    return this.prisma.tax.create({
      data: {
        ...data,
        propertyId,
      },
    });
  }

  async update(id: string, propertyId: string, data: UpdateTaxDto) {
    await this.findOne(id, propertyId);
    return this.prisma.tax.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, propertyId: string) {
    await this.findOne(id, propertyId);
    return this.prisma.tax.delete({
      where: { id },
    });
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/tax.dto';

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getPropertyId(providedId?: string) {
    if (providedId) return providedId;
    const prop = await this.prisma.property.findFirst();
    if (!prop) throw new NotFoundException('Property not found');
    return prop.id;
  }

  async findAll(propertyId?: string) {
    const pId = await this.getPropertyId(propertyId);
    return this.prisma.tax.findMany({
      where: { propertyId: pId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, propertyId?: string) {
    const pId = await this.getPropertyId(propertyId);
    const tax = await this.prisma.tax.findFirst({
      where: { id, propertyId: pId },
    });
    if (!tax) throw new NotFoundException('Tax not found');
    return tax;
  }

  async create(data: CreateTaxDto, propertyId?: string) {
    const pId = await this.getPropertyId(propertyId);
    return this.prisma.tax.create({
      data: {
        ...data,
        propertyId: pId,
      },
    });
  }

  async update(id: string, data: UpdateTaxDto, propertyId?: string) {
    const pId = await this.getPropertyId(propertyId);
    await this.findOne(id, pId);
    return this.prisma.tax.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, propertyId?: string) {
    const pId = await this.getPropertyId(propertyId);
    await this.findOne(id, pId);
    return this.prisma.tax.delete({
      where: { id },
    });
  }
}


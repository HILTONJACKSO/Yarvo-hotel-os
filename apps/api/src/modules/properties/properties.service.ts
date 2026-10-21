import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async getProperty(propertyId?: string) {
    let property = propertyId 
      ? await this.prisma.property.findUnique({ where: { id: propertyId } })
      : null;

    if (!property) {
      property = await this.prisma.property.findFirst();
    }

    if (!property) {
      // Auto-seed default property if none exists
      property = await this.prisma.property.create({
        data: {
          name: 'Yarvo Hotel',
          legalName: 'Yarvo Hospitality Group LLC',
          address: 'Broad Street',
          city: 'Monrovia',
          country: 'Liberia',
          phone: '+231 777 123 456',
          email: 'info@yarvohotel.com',
          website: 'www.yarvohotel.com',
          taxId: 'LBR-12345678',
          currencyPrimary: 'USD',
          currencySecondary: 'LRD',
        }
      });
    }

    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    const data: any = { ...updatePropertyDto };
    if (data.receiptSettings !== undefined && typeof data.receiptSettings === 'string') {
      try {
        data.receiptSettings = JSON.parse(data.receiptSettings);
      } catch (e) {
        // preserve existing if invalid JSON
      }
    }
    if (data.websiteContent !== undefined && typeof data.websiteContent === 'string') {
      try {
        data.websiteContent = JSON.parse(data.websiteContent);
      } catch (e) {
        // preserve existing if invalid JSON
      }
    }

    return this.prisma.property.update({
      where: { id },
      data,
    });
  }
}


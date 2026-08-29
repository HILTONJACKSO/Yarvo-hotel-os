import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async getProperty() {
    let property = await this.prisma.property.findFirst();

    if (!property) {
      // Auto-seed default property if none exists
      property = await this.prisma.property.create({
        data: {
          name: 'Yarvo Hotel',
          legalName: 'Yarvo Hotel & Suites LLC',
          address: 'Tubman Blvd, Sinkor',
          city: 'Monrovia',
          country: 'Liberia',
          phone: '+231 777 123 456',
          email: 'info@yarvo.com',
          website: 'www.yarvo.com',
          taxId: 'LBR-12345678',
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

    return this.prisma.property.update({
      where: { id },
      data: updatePropertyDto,
    });
  }
}


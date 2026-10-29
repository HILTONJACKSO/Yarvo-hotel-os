import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.activity.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async create(data: any) {
    const priceNum = data.price !== undefined && data.price !== null && !isNaN(Number(data.price)) ? Number(data.price) : 0;
    return this.prisma.activity.create({
      data: {
        name: data.name,
        type: data.type || 'TOUR',
        description: data.description || '',
        price: priceNum,
        image: data.image || (data.images && data.images.length > 0 ? data.images[0] : null),
        images: data.images || [],
        isActive: data.isActive ?? true
      }
    });
  }

  async update(id: string, data: any) {
    const updateData: any = {
      name: data.name,
      type: data.type,
      description: data.description,
      isActive: data.isActive
    };
    if (data.price !== undefined && data.price !== null && !isNaN(Number(data.price))) {
      updateData.price = Number(data.price);
    }
    if (data.image !== undefined) {
      updateData.image = data.image;
    } else if (data.images && data.images.length > 0) {
      updateData.image = data.images[0];
    }
    if (data.images !== undefined) {
      updateData.images = data.images;
    }

    return this.prisma.activity.update({
      where: { id },
      data: updateData
    });
  }

  async remove(id: string) {
    return this.prisma.activity.delete({ where: { id } });
  }
}

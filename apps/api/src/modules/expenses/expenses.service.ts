import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto, userId: string) {
    return this.prisma.expense.create({
      data: {
        amount: createExpenseDto.amount,
        category: createExpenseDto.category,
        date: new Date(createExpenseDto.date),
        description: createExpenseDto.description,
        referenceCode: createExpenseDto.referenceCode,
        recordedById: userId,
      },
    });
  }

  async findAll(start?: string, end?: string) {
    const where: any = {};
    if (start && end) {
      where.date = {
        gte: new Date(start),
        lte: new Date(new Date(end).setHours(23, 59, 59, 999))
      };
    }
    return this.prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });
    if (!expense) throw new NotFoundException(`Expense with ID ${id} not found`);
    return expense;
  }

  async remove(id: string) {
    const expense = await this.findOne(id);
    return this.prisma.expense.delete({ where: { id: expense.id } });
  }
}


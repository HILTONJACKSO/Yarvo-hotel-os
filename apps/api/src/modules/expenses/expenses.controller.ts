import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'MANAGER')
  async create(@Body() createExpenseDto: CreateExpenseDto, @CurrentUser() user: any) {
    const data = await this.expensesService.create(createExpenseDto, user.id);
    return { message: 'Expense recorded successfully', data };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK')
  async findAll() {
    const data = await this.expensesService.findAll();
    return { data };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async findOne(@Param('id') id: string) {
    const data = await this.expensesService.findOne(id);
    return { data };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async remove(@Param('id') id: string) {
    await this.expensesService.remove(id);
    return { message: 'Expense deleted successfully' };
  }
}


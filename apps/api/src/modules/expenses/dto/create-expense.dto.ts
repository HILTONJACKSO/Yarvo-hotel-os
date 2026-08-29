import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ExpenseCategory } from '@prisma/client';

export class CreateExpenseDto {
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsEnum(ExpenseCategory)
  @IsNotEmpty()
  category!: ExpenseCategory;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  referenceCode?: string;
}


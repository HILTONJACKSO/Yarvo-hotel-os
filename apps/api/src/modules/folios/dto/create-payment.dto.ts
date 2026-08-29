import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LineItemCategory } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Payment method category', enum: LineItemCategory })
  @IsEnum(LineItemCategory)
  category!: LineItemCategory;

  @ApiProperty({ description: 'Amount paid (must be positive)' })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ description: 'Description of the payment' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ description: 'Optional receipt or reference code' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceCode?: string;
}


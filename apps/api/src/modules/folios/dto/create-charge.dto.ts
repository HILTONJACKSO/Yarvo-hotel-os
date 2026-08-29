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

export class CreateChargeDto {
  @ApiProperty({ description: 'Category of the charge', enum: LineItemCategory })
  @IsEnum(LineItemCategory)
  category!: LineItemCategory;

  @ApiProperty({ description: 'Amount to charge (must be positive)' })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ description: 'Description of the charge' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ description: 'Optional reference or POS code' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceCode?: string;
}


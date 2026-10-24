import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LineItemCategory, LineItemType } from '@prisma/client';

export class UpdateLineItemDto {
  @ApiPropertyOptional({ description: 'Category of the line item', enum: LineItemCategory })
  @IsEnum(LineItemCategory)
  @IsOptional()
  category?: LineItemCategory;

  @ApiPropertyOptional({ description: 'Type of line item', enum: LineItemType })
  @IsEnum(LineItemType)
  @IsOptional()
  type?: LineItemType;

  @ApiPropertyOptional({ description: 'Amount (positive number)' })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Optional reference code' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceCode?: string;
}

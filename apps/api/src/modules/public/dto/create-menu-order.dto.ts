import { IsString, IsNotEmpty, IsArray, ValidateNested, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  menuItemId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateMenuOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roomNumber!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  guestName!: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

import {
  IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, Min, Max, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @ApiProperty({ example: '101' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  number!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  floor!: number;

  @ApiProperty({ description: 'UUID of the RoomType' })
  @IsString()
  @IsNotEmpty()
  roomTypeId!: string;

  @ApiPropertyOptional({ example: 'Corner room, great sea view' })
  @IsString()
  @IsOptional()
  notes?: string;
}


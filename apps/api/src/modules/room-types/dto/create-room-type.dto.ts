import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MaxLength,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRoomTypeDto {
  @ApiProperty({ example: 'Standard Double' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'STD-DBL', description: 'Unique short code' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiPropertyOptional({ example: 'Comfortable room with city view' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  maxOccupancy!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  maxAdults!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  maxChildren!: number;

  @ApiProperty({ example: 89.99, description: 'Nightly rate in USD' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Type(() => Number)
  baseRateUsd!: number;

  @ApiProperty({ example: 15000, description: 'Nightly rate in LRD' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Type(() => Number)
  baseRateLrd!: number;

  @ApiPropertyOptional({ example: ['WiFi', 'AC', 'TV', 'Mini Bar'] })
  @IsArray()
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({ example: [] })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  taxIds?: string[];
}


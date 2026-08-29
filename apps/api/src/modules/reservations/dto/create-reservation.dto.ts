import {
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  guestId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  guestFirstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  guestLastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  guestEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  guestPhone?: string;
  @ApiProperty()
  @IsUUID()
  roomTypeId!: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roomId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @ApiProperty()
  @IsDateString()
  checkInDate!: string;

  @ApiProperty()
  @IsDateString()
  checkOutDate!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  adultsCount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  childrenCount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  specialRequests?: string;
}


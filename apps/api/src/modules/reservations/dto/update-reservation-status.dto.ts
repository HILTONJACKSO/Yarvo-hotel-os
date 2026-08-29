import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';

export class UpdateReservationStatusDto {
  @ApiProperty({ enum: ReservationStatus })
  @IsEnum(ReservationStatus)
  status!: ReservationStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roomId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}


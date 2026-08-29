import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomStatus } from '@prisma/client';

export class ChangeRoomStatusDto {
  @ApiProperty({ enum: RoomStatus, example: RoomStatus.DIRTY })
  @IsEnum(RoomStatus)
  status!: RoomStatus;

  @ApiPropertyOptional({ example: 'Guest checked out, needs cleaning' })
  @IsString()
  @IsOptional()
  reason?: string;
}


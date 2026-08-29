import { PartialType } from '@nestjs/swagger';
import { CreateRoomTypeDto } from './create-room-type.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoomTypeDto extends PartialType(CreateRoomTypeDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


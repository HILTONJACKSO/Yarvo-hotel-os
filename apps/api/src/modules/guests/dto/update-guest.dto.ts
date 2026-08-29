import { PartialType } from '@nestjs/swagger';
import { CreateGuestDto } from './create-guest.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGuestDto extends PartialType(CreateGuestDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


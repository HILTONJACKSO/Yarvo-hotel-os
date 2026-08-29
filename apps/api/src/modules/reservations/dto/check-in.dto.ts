import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckInDto {
  @ApiProperty({ description: 'The physical Room ID to assign to this reservation upon Check-In' })
  @IsUUID()
  @IsNotEmpty()
  roomId!: string;
}


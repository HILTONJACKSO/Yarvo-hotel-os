import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber, IsDateString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventBookingDto {
  @ApiProperty({ example: 'uuid-of-space', required: false })
  @IsString()
  @IsOptional()
  spaceId?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  guestName!: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @ValidateIf((o) => !!o.guestEmail && typeof o.guestEmail === 'string' && o.guestEmail.trim() !== '')
  @IsEmail()
  @IsOptional()
  guestEmail?: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  guestPhone!: string;

  @ApiProperty({ example: 'Wedding' })
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  attendeesCount!: number;

  @ApiProperty({ example: '2027-01-01T10:00:00Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2027-01-01T18:00:00Z' })
  @IsDateString()
  endTime!: string;

  @ApiProperty({ example: 'Need a projector' })
  @IsString()
  @IsOptional()
  specialRequests?: string;
}

import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventBookingDto {
  @ApiProperty({ example: 'uuid-of-space' })
  @IsString()
  @IsNotEmpty()
  spaceId!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  guestName!: string;

  @ApiProperty({ example: 'john@example.com' })
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

import { IsString, IsNotEmpty, IsEmail, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  specialRequests?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roomTypeId!: string;

  @ApiProperty({ example: '2027-01-01' })
  @IsDateString()
  @IsNotEmpty()
  checkInDate!: string;

  @ApiProperty({ example: '2027-01-05' })
  @IsDateString()
  @IsNotEmpty()
  checkOutDate!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  adultsCount!: number;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  childrenCount?: number;
}

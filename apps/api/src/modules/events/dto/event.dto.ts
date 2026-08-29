import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateEventSpaceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsNumber()
  @IsNotEmpty()
  pricePerHour!: number;

  @IsNumber()
  @IsNotEmpty()
  pricePerDay!: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateEventSpaceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsNumber()
  @IsOptional()
  pricePerHour?: number;

  @IsNumber()
  @IsOptional()
  pricePerDay?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export enum EventBookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export class CreateEventBookingDto {
  @IsString()
  @IsNotEmpty()
  spaceId!: string;

  @IsString()
  @IsNotEmpty()
  guestName!: string;

  @IsString()
  @IsOptional()
  guestEmail?: string;

  @IsString()
  @IsNotEmpty()
  guestPhone!: string;

  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @IsNumber()
  @IsOptional()
  attendeesCount?: number;

  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @IsDateString()
  @IsNotEmpty()
  endTime!: string;

  @IsEnum(EventBookingStatus)
  @IsOptional()
  status?: EventBookingStatus;

  @IsNumber()
  @IsNotEmpty()
  totalAmount!: number;

  @IsNumber()
  @IsOptional()
  amountPaid?: number;

  @IsString()
  @IsOptional()
  specialRequests?: string;
}

export class UpdateEventBookingDto {
  @IsString()
  @IsOptional()
  guestName?: string;

  @IsString()
  @IsOptional()
  guestEmail?: string;

  @IsString()
  @IsOptional()
  guestPhone?: string;

  @IsString()
  @IsOptional()
  eventType?: string;

  @IsNumber()
  @IsOptional()
  attendeesCount?: number;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsEnum(EventBookingStatus)
  @IsOptional()
  status?: EventBookingStatus;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsNumber()
  @IsOptional()
  amountPaid?: number;

  @IsString()
  @IsOptional()
  specialRequests?: string;
}


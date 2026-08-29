import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderType, WorkOrderPriority } from '@prisma/client';

export class CreateWorkOrderDto {
  @ApiProperty({ enum: WorkOrderType })
  @IsEnum(WorkOrderType)
  type!: WorkOrderType;

  @ApiProperty({ enum: WorkOrderPriority })
  @IsEnum(WorkOrderPriority)
  priority!: WorkOrderPriority;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roomId?: string;
}


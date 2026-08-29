import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckOutDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  billToCompany?: boolean;
}

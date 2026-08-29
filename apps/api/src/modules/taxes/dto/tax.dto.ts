import { IsString, IsNotEmpty, IsEnum, IsNumber, IsBoolean, IsOptional, IsArray } from 'class-validator';

export enum TaxType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT_AMOUNT = 'FLAT_AMOUNT',
}

export class CreateTaxDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsNotEmpty()
  rate!: number;

  @IsEnum(TaxType)
  @IsOptional()
  type?: TaxType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTaxDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  rate?: number;

  @IsEnum(TaxType)
  @IsOptional()
  type?: TaxType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/tax.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('taxes')
@UseGuards(JwtAuthGuard)
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.taxesService.findAll(req.user?.propertyId);
  }

  @Post()
  create(@Req() req: any, @Body() createTaxDto: CreateTaxDto) {
    return this.taxesService.create(createTaxDto, req.user?.propertyId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.taxesService.findOne(id, req.user?.propertyId);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() updateTaxDto: UpdateTaxDto) {
    return this.taxesService.update(id, updateTaxDto, req.user?.propertyId);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.taxesService.remove(id, req.user?.propertyId);
  }
}


import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Properties')
@ApiCookieAuth('accessToken')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get the main property configuration' })
  @ApiResponse({ status: 200, description: 'The property configuration.' })
  getProperty() {
    return this.propertiesService.getProperty();
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  @ApiOperation({ summary: 'Update property configuration' })
  @ApiResponse({ status: 200, description: 'Property successfully updated.' })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertiesService.update(id, updatePropertyDto);
  }
}


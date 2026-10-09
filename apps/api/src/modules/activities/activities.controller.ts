import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Controller('v1/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  findAll() {
    return this.activitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.activitiesService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.activitiesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}

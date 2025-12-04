import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PauseCausesService } from './pause-causes.service';
import { CreatePauseCauseDto } from './dto/create-pause-cause.dto';
import { UpdatePauseCauseDto } from './dto/update-pause-cause.dto';

@Controller('pause-causes')
export class PauseCausesController {
  constructor(private readonly pauseCausesService: PauseCausesService) {}

  @Post()
  create(@Body() createPauseCauseDto: CreatePauseCauseDto) {
    return this.pauseCausesService.create(createPauseCauseDto);
  }

  @Get()
  findAll() {
    return this.pauseCausesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pauseCausesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePauseCauseDto: UpdatePauseCauseDto) {
    return this.pauseCausesService.update(id, updatePauseCauseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pauseCausesService.remove(id);
  }
}

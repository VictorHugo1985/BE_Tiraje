import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto'; // Import new DTO

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body() createJobDto: CreateJobDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.jobsService.create(createJobDto, user);
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('press') press?: string) {
    return this.jobsService.findAll(status, press);
  }



  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.jobsService.update(id, updateJobDto, user);
  }

  @Post(':id/timeline') // New endpoint for adding timeline events
  addTimelineEvent(@Param('id') id: string, @Body() eventDto: CreateTimelineEventDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.jobsService.addTimelineEvent(id, eventDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}

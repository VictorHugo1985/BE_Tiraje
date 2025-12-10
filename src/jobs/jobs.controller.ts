import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserPayload } from '../common/interfaces/user-payload.interface';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body() createJobDto: CreateJobDto, @GetUser() user: UserPayload) {
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
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto, @GetUser() user: UserPayload) {
    return this.jobsService.update(id, updateJobDto, user);
  }

  @Post(':id/timeline')
  addTimelineEvent(
    @Param('id') id: string,
    @Body() eventDto: CreateTimelineEventDto,
    @GetUser() user: UserPayload,
  ) {
    return this.jobsService.addTimelineEvent(id, eventDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.jobsService.remove(id, user);
  }
}

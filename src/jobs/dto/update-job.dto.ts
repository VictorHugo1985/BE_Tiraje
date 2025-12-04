import { PartialType } from '@nestjs/mapped-types';
import { CreateJobDto } from './create-job.dto';
import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTimelineEventDto } from './create-timeline-event.dto';

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @IsString()
  @IsOptional()
  @IsEnum(['en cola', 'en curso', 'pausado', 'terminado', 'cancelado']) // Directly use the enum values
  status?: string;




  @IsString()
  @IsOptional()
  operatorComments?: string;

  @IsString()
  @IsOptional()
  machineSpeed?: string;

  @IsString()
  @IsOptional()
  startedByUserId?: string; // New field for the user who started the job

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimelineEventDto)
  @IsOptional()
  timeline?: CreateTimelineEventDto[];
}

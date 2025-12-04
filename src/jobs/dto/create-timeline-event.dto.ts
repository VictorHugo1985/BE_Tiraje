import { IsDateString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum TimelineEventType {
  PRODUCTION_START = 'production_start',
  PRODUCTION_END = 'production_end',
  SETUP_START = 'setup_start',
  SETUP_END = 'setup_end',
  PAUSE_START = 'pause_start',
  PAUSE_END = 'pause_end',
}

export class CreateTimelineEventDto {
  @IsDateString()
  timestamp: string;

  @IsEnum(TimelineEventType)
  type: TimelineEventType;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

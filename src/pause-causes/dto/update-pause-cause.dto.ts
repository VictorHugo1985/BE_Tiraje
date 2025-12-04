import { PartialType } from '@nestjs/mapped-types';
import { CreatePauseCauseDto } from './create-pause-cause.dto';

export class UpdatePauseCauseDto extends PartialType(CreatePauseCauseDto) {}

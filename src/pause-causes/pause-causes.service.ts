import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PauseCause, PauseCauseDocument } from './schemas/pause-cause.schema';
import { CreatePauseCauseDto } from './dto/create-pause-cause.dto';
import { UpdatePauseCauseDto } from './dto/update-pause-cause.dto';

@Injectable()
export class PauseCausesService {
  constructor(@InjectModel(PauseCause.name) private pauseCauseModel: Model<PauseCauseDocument>) {}

  async create(createPauseCauseDto: CreatePauseCauseDto): Promise<PauseCause> {
    const createdCause = new this.pauseCauseModel(createPauseCauseDto);
    return createdCause.save();
  }

  async findAll(): Promise<PauseCause[]> {
    return this.pauseCauseModel.find().exec();
  }

  async findOne(id: string): Promise<PauseCause> {
    const cause = await this.pauseCauseModel.findById(id).exec();
    if (!cause) {
      throw new NotFoundException(`Pause cause with ID "${id}" not found`);
    }
    return cause;
  }

  async update(id: string, updatePauseCauseDto: UpdatePauseCauseDto): Promise<PauseCause> {
    const existingCause = await this.pauseCauseModel.findByIdAndUpdate(
      id,
      updatePauseCauseDto,
      { new: true },
    ).exec();
    if (!existingCause) {
      throw new NotFoundException(`Pause cause with ID "${id}" not found`);
    }
    return existingCause;
  }

  async remove(id: string): Promise<PauseCause> {
    const deletedCause = await this.pauseCauseModel.findByIdAndDelete(id).exec();
    if (!deletedCause) {
      throw new NotFoundException(`Pause cause with ID "${id}" not found`);
    }
    return deletedCause;
  }
}

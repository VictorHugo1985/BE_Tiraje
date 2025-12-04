import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { Job, JobDocument, TimelineEvent } from './schemas/job.schema';

// Helper para poblar los datos del usuario en el timeline
const populateUser = {
  path: 'timeline.userId',
  select: '_id name employeeId', // Selecciona solo los campos necesarios
};

@Injectable()
export class JobsService {
  constructor(@InjectModel(Job.name) private jobModel: Model<JobDocument>) {}

  async create(createJobDto: CreateJobDto, user: any): Promise<Job> {
    const createdJob = new this.jobModel(createJobDto);
    // Opcional: registrar quién creó el trabajo
    const creationEvent: TimelineEvent = {
      userId: user.userId,
      timestamp: new Date(),
      type: 'creation',
      details: { message: `Trabajo creado por ${user.name}` },
    };
    createdJob.timeline.push(creationEvent);
    try {
      return await createdJob.save();
    } catch (error) {
      if (error.code === 11000) { // MongoDB duplicate key error
        throw new BadRequestException(`OT '${createJobDto.ot}' already exists.`);
      }
      throw error;
    }
  }

  async findAll(status?: string, press?: string): Promise<Job[]> {
    const filter: any = {};
    if (status) filter.status = status;
    if (press) filter.press = press;
    return this.jobModel.find(filter).populate(populateUser).sort({ priority: 1 }).exec();
  }
  
  async findOne(id: string): Promise<Job> {
    const job = await this.jobModel.findById(id).populate(populateUser).exec();
    if (!job) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }
    return job;
  }

  async update(id: string, updateJobDto: UpdateJobDto, user: any): Promise<Job> {
    const job = await this.jobModel.findById(id).exec();
    if (!job) throw new NotFoundException(`Job with ID "${id}" not found`);

    const oldJobObject = job.toObject(); // Estado antes del cambio

    // Aplicar cambios
    Object.assign(job, updateJobDto);

    if (updateJobDto.startedByUserId !== undefined) {
      job.startedByUserId = updateJobDto.startedByUserId as any; // Cast to any to bypass strict type checking for ObjectId
    }

    const changes: any = {};
    for (const key in updateJobDto) {
      if (JSON.stringify((oldJobObject as any)[key]) !== JSON.stringify((job as any)[key])) {
        changes[key] = { from: (oldJobObject as any)[key], to: (job as any)[key] };
      }
    }

    if (Object.keys(changes).length > 0) {
      const editEvent: TimelineEvent = {
        userId: user.userId,
        timestamp: new Date(),
        type: 'edit',
        details: {
          message: `Trabajo editado por ${user.name}`,
          changes,
        },
      };
      job.timeline.push(editEvent);
    }
    
    this._calculateMetrics(job);
    const updatedJob = await job.save();
    return this.findOne(updatedJob._id.toString()); // Re-fetch para obtener el populado
  }

  async addTimelineEvent(jobId: string, eventDto: CreateTimelineEventDto, user: any): Promise<Job> {
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) throw new NotFoundException(`Job with ID "${jobId}" not found`);

    const newEvent: TimelineEvent = {
      userId: user.userId,
      timestamp: new Date(eventDto.timestamp),
      type: eventDto.type,
      details: eventDto.details,
    };

    job.timeline.push(newEvent);

    this._calculateMetrics(job);
    const updatedJob = await job.save();
    return this.findOne(updatedJob._id.toString()); // Re-fetch para obtener el populado
  }

  async remove(id: string): Promise<Job> {
    const deletedJob = await this.jobModel.findByIdAndDelete(id).exec();
    if (!deletedJob) throw new NotFoundException(`Job with ID "${id}" not found`);
    return deletedJob;
  }
  
  // No hay cambios necesarios en el resto de los métodos privados
  private _calculateMetrics(job: JobDocument): void {
    let totalPauseTime = 0; // in seconds
    let totalSetupTime = 0; // in seconds
    let pauseCount = 0;
    let setupCount = 0;

    let pauseStart: Date | null = null;
    let setupStart: Date | null = null;

    const sortedTimeline = [...job.timeline].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    sortedTimeline.forEach((event) => {
      switch (event.type) {
        case 'pause_start':
          pauseStart = event.timestamp;
          pauseCount++;
          break;
        case 'pause_end':
          if (pauseStart) {
            totalPauseTime += (event.timestamp.getTime() - pauseStart.getTime()) / 1000;
            pauseStart = null;
          }
          break;
        case 'setup_start':
          setupStart = event.timestamp;
          setupCount++;
          break;
        case 'setup_end':
          if (setupStart) {
            totalSetupTime += (event.timestamp.getTime() - setupStart.getTime()) / 1000;
            setupStart = null;
          }
          break;
      }
    });

    // If a pause or setup is still active (e.g., job is currently paused/in setup)
    const now = new Date();
    if (pauseStart) {
      totalPauseTime += (now.getTime() - (pauseStart as Date).getTime()) / 1000;
    }
    if (setupStart) {
      totalSetupTime += (now.getTime() - (setupStart as Date).getTime()) / 1000;
    }

    job.totalPauseTime = totalPauseTime;
    job.totalSetupTime = totalSetupTime;
    job.pauseCount = pauseCount;
    job.setupCount = setupCount;
  }
  
  // Este método ya no es necesario, lo elimino para mantener el código limpio
  // async findAllWithFinished(show: boolean): Promise<Job[]> { ... }
}

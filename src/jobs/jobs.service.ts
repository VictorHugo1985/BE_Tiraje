import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { Job, JobDocument, TimelineEvent } from './schemas/job.schema';
import { UserPayload } from '../common/interfaces/user-payload.interface';

// Helper para poblar los datos del usuario en el timeline
const populateUser = {
  path: 'timeline.userId',
  select: '_id name employeeId', // Selecciona solo los campos necesarios
};

@Injectable()
export class JobsService {
  constructor(@InjectModel(Job.name) private jobModel: Model<JobDocument>) {}

  async create(createJobDto: CreateJobDto, user: UserPayload): Promise<Job> {
    const createdJob = new this.jobModel({
      ...createJobDto,
      createdBy: user.userId,
    });
    // Opcional: registrar quién creó el trabajo
    const creationEvent: TimelineEvent = {
      userId: user.userId as any, // Cast to any to satisfy mongoose ref type
      timestamp: new Date(),
      type: 'creation',
      details: { message: `Trabajo creado por ${user.name}` },
    };
    createdJob.timeline.push(creationEvent);
    try {
      // If priority is not provided, set it to max + 1 for the target press
      if (createdJob.priority === undefined || createdJob.priority === null) {
        const maxPriorityJob = await this.jobModel.findOne({ press: createdJob.press, status: 'en cola' })
          .sort({ priority: -1 })
          .select('priority')
          .exec();
        createdJob.priority = (maxPriorityJob?.priority || 0) + 1;
      }
      
      const savedJob = await createdJob.save(); // Save the job
      await this._reassignQueuePriorities([savedJob.press]); // Reassign priorities for the affected press
      return savedJob;
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

  async update(id: string, updateJobDto: UpdateJobDto, user: UserPayload): Promise<Job> {
    const job = await this.jobModel.findById(id).exec();
    if (!job) throw new NotFoundException(`Job with ID "${id}" not found`);

    if (job.createdBy && job.createdBy.toString() !== user.userId) {
      throw new UnauthorizedException('You are not authorized to update this job');
    }

    const oldJobObject = job.toObject(); // Estado antes del cambio
    const oldStatus = oldJobObject.status;
    const oldPress = oldJobObject.press;
    // const oldPriority = oldJobObject.priority; // No longer needed for this logic

    console.log(`[JobsService] update method - Incoming updateJobDto for job ${id}:`, updateJobDto);
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
        userId: user.userId as any, // Cast to any to satisfy mongoose ref type
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

    // Determine which presses need priority re-assignment
    const pressesToReassign: string[] = [];

    // Case 1: Press changed
    if (updateJobDto.press && updateJobDto.press !== oldPress) {
        pressesToReassign.push(oldPress); // Reassign old press
        pressesToReassign.push(updatedJob.press); // Reassign new press
    } else if (updateJobDto.priority !== undefined && updateJobDto.priority !== oldJobObject.priority) {
        // Case 2: Priority changed within the same press
        // Ensure that a priority change within the same press also triggers a re-assignment
        pressesToReassign.push(updatedJob.press);
    }
    
    if (pressesToReassign.length > 0) {
      await this._reassignQueuePriorities(pressesToReassign);
    }

    return this.findOne(updatedJob._id.toString()); // Re-fetch para obtener el populado
  }

  async addTimelineEvent(jobId: string, eventDto: CreateTimelineEventDto, user: UserPayload): Promise<Job> {
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) throw new NotFoundException(`Job with ID "${jobId}" not found`);

    const newEvent: TimelineEvent = {
      userId: user.userId as any, // Cast to any to satisfy mongoose ref type
      timestamp: new Date(eventDto.timestamp),
      type: eventDto.type,
      details: eventDto.details,
    };

    job.timeline.push(newEvent);

    this._calculateMetrics(job);
    const updatedJob = await job.save();
    return this.findOne(updatedJob._id.toString()); // Re-fetch para obtener el populado
  }

  async remove(id: string, user: UserPayload): Promise<Job> {
    const job = await this.jobModel.findById(id).exec();
    if (!job) throw new NotFoundException(`Job with ID "${id}" not found`);

    if (job.createdBy && job.createdBy.toString() !== user.userId) {
      throw new UnauthorizedException('You are not authorized to delete this job');
    }

    const deletedJob = await this.jobModel.findByIdAndDelete(id).exec();
    if (!deletedJob) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }
    // Reassign priorities in the press from which the job was removed.
    await this._reassignQueuePriorities([deletedJob.press]);
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

  /**
   * Reassigns priorities for jobs that are in the 'en cola' (queued) status.
   * If 'presses' are provided, it reassigns priorities only for those specific presses.
   * Otherwise, it reassigns for all presses that have queued jobs.
   * Jobs are sorted by their current priority to maintain manual ordering.
   * The priorities are then updated sequentially starting from 1.
   */
  private async _reassignQueuePriorities(presses?: string[]): Promise<void> {
    let pressesToProcess: string[] = [];

    if (presses && presses.length > 0) {
      pressesToProcess = Array.from(new Set(presses)); // Ensure unique presses
    } else {
      // Find all unique presses that have jobs in 'en cola' status
      const distinctPresses = await this.jobModel.distinct('press', { status: 'en cola' }).exec();
      pressesToProcess = distinctPresses;
    }

    for (const press of pressesToProcess) {
      const queuedJobs = await this.jobModel.find({ status: 'en cola', press: press })
        .sort({ priority: 1 }) // Sort only by existing priority to maintain manual order
        .exec();

      let currentPriority = 1;
      const bulkOperations = queuedJobs.map(job => ({
        updateOne: {
          filter: { _id: job._id },
          update: { $set: { priority: currentPriority++ } }
        }
      }));

      if (bulkOperations.length > 0) {
        await this.jobModel.bulkWrite(bulkOperations);
      }
    }
  }
}

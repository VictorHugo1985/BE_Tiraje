import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type JobDocument = Job & Document;

// Definición explícita para un evento en el timeline
@Schema({ _id: false })
export class TimelineEvent {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ 
    type: String,
    enum: ['production_start', 'production_end', 'setup_start', 'setup_end', 'pause_start', 'pause_end', 'creation', 'edit'],
    required: true 
  })
  type: string;

  @Prop({ type: Object })
  details?: Record<string, any>;
}
export const TimelineEventSchema = SchemaFactory.createForClass(TimelineEvent);


@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true, unique: true })
  ot: string;

  @Prop({ required: true })
  client: string;

  @Prop({ required: true })
  jobType: string;

  @Prop({ default: 0 })
  quantityPlanned: number; // Renamed from quantity

  @Prop({ default: '' })
  comments: string;

  @Prop({ default: '' })
  operatorComments: string;

  @Prop({ default: '' })
  machineSpeed: string;

  @Prop({ default: false })
  pantone: boolean;

  @Prop({ default: false })
  barniz: boolean;

  @Prop({ default: false })
  is4x0: boolean;

  @Prop({ default: false })
  is4x4: boolean;

  @Prop({
    type: String,
    enum: ['en cola', 'en curso', 'pausado', 'terminado', 'cancelado'],
    default: 'en cola',
  })
  status: string;

  @Prop()
  press: string;

  @Prop()
  priority: number;

  // New fields for operator data and calculated metrics
  @Prop({ default: 0 })
  setupCount: number;

  @Prop({ default: 0 })
  totalSetupTime: number; // in seconds

  @Prop({ default: 0 })
  pauseCount: number;

  @Prop({ default: 0 })
  totalPauseTime: number; // in seconds

  @Prop({ type: [TimelineEventSchema], default: [] })
  timeline: TimelineEvent[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  startedByUserId?: User;
}

export const JobSchema = SchemaFactory.createForClass(Job);

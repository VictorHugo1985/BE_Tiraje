import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PauseCauseDocument = PauseCause & Document;

@Schema({ timestamps: true })
export class PauseCause {
  @Prop({ required: true, unique: true })
  name: string; // e.g., "Falta de Papel", "Ajuste de Color"

  @Prop()
  description: string; // Optional detailed description
}

export const PauseCauseSchema = SchemaFactory.createForClass(PauseCause);

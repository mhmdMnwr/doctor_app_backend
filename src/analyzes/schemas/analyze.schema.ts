import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnalyzeDocument = Analyze & Document;

@Schema({ timestamps: true })
export class Analyze {
  @Prop({ required: true })
  patientId!: string;

  @Prop({ type: [String], required: true })
  analyzeNames!: string[];
}

export const AnalyzeSchema = SchemaFactory.createForClass(Analyze);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  familyName!: string;

  @Prop()
  comment?: string;

  @Prop()
  phoneNumber?: string;

  @Prop({ required: true })
  birthdate!: Date;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CertificateDocument = Certificate & Document;

@Schema({ timestamps: true })
export class Certificate {
  @Prop({ required: true })
  patientId!: string;

  @Prop({ required: true })
  commentaire!: string;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);

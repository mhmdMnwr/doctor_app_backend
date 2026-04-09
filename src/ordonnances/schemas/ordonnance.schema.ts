import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class MedicineItem {
  @Prop({ required: false })
  medicine?: string;

  @Prop({ required: false })
  dosage?: string;
}

export const MedicineItemSchema = SchemaFactory.createForClass(MedicineItem);

export type OrdonnanceDocument = Ordonnance & Document;

@Schema({ timestamps: true })
export class Ordonnance {
  @Prop({ required: true })
  patientId!: string;

  @Prop({ type: [MedicineItemSchema], required: false, default: [] })
  medicines?: MedicineItem[];

  @Prop({ required: true })
  diagnostic!: string;
}

export const OrdonnanceSchema = SchemaFactory.createForClass(Ordonnance);

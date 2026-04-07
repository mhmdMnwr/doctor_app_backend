import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class MedicineItem {
  @Prop({ required: true })
  medicine!: string;

  @Prop({ required: true })
  dosage!: string;
}

export const MedicineItemSchema = SchemaFactory.createForClass(MedicineItem);

export type OrdonnanceDocument = Ordonnance & Document;

@Schema({ timestamps: true })
export class Ordonnance {
  @Prop({ required: true })
  patientId!: string;

  @Prop({ type: [MedicineItemSchema], required: true })
  medicines!: MedicineItem[];

  @Prop({ required: true })
  diagnostic!: string;
}

export const OrdonnanceSchema = SchemaFactory.createForClass(Ordonnance);

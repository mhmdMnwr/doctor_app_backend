import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;
export const ADMIN_ROLES = ['doctor', 'assistant'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

@Schema({ timestamps: true })
export class Admin {
    @Prop({ required: true, unique: true })
    username!: string;

    @Prop({ required: true })
    password!: string;

    @Prop({ required: true, enum: ADMIN_ROLES, default: 'assistant' })
    role!: AdminRole;

    @Prop({ default: 0 })
    tokenVersion!: number;

    @Prop()
    address?: string;

    @Prop()
    phoneNumber?: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
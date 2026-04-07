import { Prop , Schema, SchemaFactory} from "@nestjs/mongoose";
import { Document } from "mongoose";

export type AdminDocument = Admin & Document;

@Schema({timestamps: true})
export class Admin {
    @Prop({required: true, unique: true})
    username!: string;
    
    @Prop({required: true})
    password!: string;

    @Prop({ default: 0 })
    tokenVersion!: number;

    @Prop()
    address?: string;
    
    @Prop()
    phoneNumber?: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
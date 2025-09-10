import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true, _id: false })
export class User extends Document {
    @Prop({
        required: true,
        unique: true,
        default: uuidv4,
        index: true,
        _id: true,
    })
    _id: string;

    @Prop({ required: true, unique: true })
    username: string;

    @Prop()
    fullName: string;

    @Prop()
    avatar: string; // URL ảnh đại diện

    @Prop({ type: String, enum: ['user', 'admin'], default: 'user' })
    role: string; // Role for permissions

    @Prop({ type: Date, default: null })
    sellerSince: Date; // Ngày trở thành người bán, null nếu là user thông thường

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

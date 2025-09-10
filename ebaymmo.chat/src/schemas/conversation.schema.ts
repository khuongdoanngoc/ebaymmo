import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

interface Participant {
    _id: string;
}

@Schema({ timestamps: true })
export class Conversation extends Document {
    @Prop({ type: String, enum: ['private', 'group', 'self'], required: true })
    type: string; // Distinguish between private or group conversation

    // ref to user
    @Prop([{ type: String, required: true, ref: 'User' } ])
    participants: Participant[]; // List of participants

    @Prop({ type: Types.ObjectId, ref: 'Message' })
    lastMessage: Types.ObjectId;

    @Prop({ type: Date, default: Date.now })
    createdAt: Date;

    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;

    @Prop([{ type: Types.ObjectId, ref: 'Message' }])
    messages: Types.ObjectId[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

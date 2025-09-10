import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Conversation' })
    conversationId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'BidChat' })
    bidChatId: Types.ObjectId; // ID của phòng chat, liên kết với BidChat

    @Prop({ type: Object, required: true })
    sender: {
        username: string;
        avatar: string;
        _id: string;
    };

    @Prop({
        type: String,
        enum: ['text', 'image', 'video', 'file', 'sticker'],
        required: true,
    })
    type: string;

    @Prop({
        type: String,
        required: function () {
            return this.type === 'text';
        },
    })
    content: string;

    @Prop({ type: String })
    mediaUrl: string;

    @Prop({
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent',
    })
    status: string;

    @Prop({ type: Date, default: Date.now })
    createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

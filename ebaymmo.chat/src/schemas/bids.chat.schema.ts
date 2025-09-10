// bid.chat.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class BidChat extends Document {
    @Prop({ type: String, required: true })
    name: string; // Tên nhóm chat

    @Prop({ type: String, required: true })
    bidId: string; // ID của phiên đấu giá liên quan

    @Prop([{ type: String, ref: 'User' }])
    participants: string[];

    @Prop({ type: String })
    lastMessage: string;

    @Prop({ type: Date, default: Date.now })
    lastMessageAt: Date;

    @Prop({ type: Boolean, default: true })
    isActive: boolean; // Trạng thái phòng chat (active/inactive)

    @Prop({ type: Date, default: Date.now })
    createdAt: Date;

    @Prop({ type: Date })
    updatedAt: Date;
}

export const BidChatSchema = SchemaFactory.createForClass(BidChat);

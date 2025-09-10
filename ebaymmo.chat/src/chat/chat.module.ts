import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message, MessageSchema } from '../schemas/message.schema';
import {
    Conversation,
    ConversationSchema,
} from '../schemas/conversation.schema';
import { JwtModule } from '@nestjs/jwt';
import { UserSchema } from 'src/schemas/user.schema';
import { User } from 'src/schemas/user.schema';
import { ChatController } from './chat.controller';
import { AuthModule } from 'src/auth/auth.module';
import { BidChat, BidChatSchema } from '../schemas/bids.chat.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
            { name: Conversation.name, schema: ConversationSchema },
            { name: User.name, schema: UserSchema },
            { name: BidChat.name, schema: BidChatSchema },
        ]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1h' },
        }),
        AuthModule,
    ],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
    exports: [MongooseModule, ChatService],
})
export class ChatModule {}

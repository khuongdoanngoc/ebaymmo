import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { User, UserSchema } from '../schemas/user.schema';
import { ChatModule } from '../chat/chat.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ChatModule,
    AuthModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {} 
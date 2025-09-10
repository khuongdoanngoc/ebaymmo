import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { ConfigModule } from './common/config/config.module';
import { AppLogger } from './logger.service';
import { LoggingInterceptor } from './logging.interceptor';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
    imports: [
        HttpModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1h' },
        }),
        ScheduleModule.forRoot(),
        ConfigModule,
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGO_URI'),
            }),
            inject: [ConfigService],
        }),
        ChatModule,
        AuthModule,
        NotificationModule,
    ],
    controllers: [AppController],
    providers: [
        AppLogger,
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {}

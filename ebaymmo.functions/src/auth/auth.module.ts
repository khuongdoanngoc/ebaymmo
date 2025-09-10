import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SdkModule } from 'src/sdk/sdk.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from 'src/common/config/config.module';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from 'src/logger.service';
import { googleOauthConfig } from 'src/common/config/oauth-google.config';
import { GoogleStrategy } from 'src/strategies/google.strategy';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [
    NestConfigModule.forFeature(googleOauthConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwtSecret'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    SdkModule,
    HttpModule,
  ],
  providers: [AuthService, AppLogger, GoogleStrategy, MailService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

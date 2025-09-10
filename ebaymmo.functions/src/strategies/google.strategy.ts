import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigType } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import { googleOauthConfig } from 'src/common/config/oauth-google.config';
import { AuthService } from 'src/auth/auth.service';
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(googleOauthConfig.KEY)
    private googleConfig: ConfigType<typeof googleOauthConfig>,
    private authService: AuthService,
  ) {
    super({
      clientID: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    try {
      const user = await this.authService.validateGoogleUser({
        profile: {
          email: profile.emails[0].value,
          sub: profile.id,
          name: profile.displayName,
        },
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}

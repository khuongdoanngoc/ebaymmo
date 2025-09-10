import { registerAs } from '@nestjs/config';

export const googleOauthConfig = registerAs('oauthGoogle', () => ({
  clientId: process.env.AUTH_GOOGLE_ID,
  clientSecret: process.env.AUTH_GOOGLE_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}));

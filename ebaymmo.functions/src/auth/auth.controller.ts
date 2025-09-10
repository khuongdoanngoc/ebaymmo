import { Body, Controller, Post, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HasuraActionsPayload, HasuraActionsPayloadObject } from 'src/types';
import { LoginResponse } from 'src/sdk/sdk';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenResponse } from '../types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(
    @Body()
    payload: HasuraActionsPayload<{ email: string; password: string }>,
  ) {
    const { email, password } = payload.input;
    const result: LoginResponse = await this.authService.handleLogin(email, password);
    return result;
  }

  @Post('register')
  async register(
    @Body()
    payload: HasuraActionsPayloadObject<{
      password: string;
      email: string;
      username: string;
    }>,
  ) {
    const { email, password, username } = payload.input.input;
    const result = await this.authService.handleRegister(email, password, username);
    console.log(result);
    return result;
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: HasuraActionsPayload<{ refreshToken: string }>) {
    const { refreshToken } = body.input;
    const result: RefreshTokenResponse = await this.authService.refresh(refreshToken);
    return result;
  }

  @Get('google/login')
  async googleAuth() {
    // Trigger Google OAuth2 flow
  }

  @Post('google/callback')
  async googleAuthCallback(
    @Body()
    body: HasuraActionsPayload<{
      email: string;
      name?: string;
      googleId?: string;
    }>,
  ) {
    console.log('body', body);
    return this.authService.validateGoogleUser(body.input);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() payload: HasuraActionsPayload<{ email: string }>) {
    const { email } = payload.input;
    return this.authService.handleForgotPassword(email);
  }

  @Post('/reset-password')
  async resetPassword(
    @Body()
    body: HasuraActionsPayload<{ token: string; newPassword: string }>,
  ) {
    return this.authService.handleResetPassword(body.input);
  }

  //change password function
  @Post('change-password')
  async changePassword(
    @Body()
    payload: HasuraActionsPayloadObject<{
      token: string;
      newPassword: string;
      oldPassword: string;
    }>,
  ) {
    const { token, oldPassword, newPassword } = payload.input.input;
    return this.authService.changePassword(token, oldPassword, newPassword);
  }

  @Post('send-contact-email')
  async sendContactEmail(
    @Body()
    payload: HasuraActionsPayloadObject<{
      email: string;
      phone: string;
      need: string;
      content: string;
    }>,
  ) {
    const { email, phone, need, content } = payload.input.input;
    return this.authService.handleContactEmail({
      email,
      phone,
      need,
      content,
    });
  }

  @Post('enable-2fa')
  async enable2FA(@Body() body: HasuraActionsPayload) {
    const userId = body.session_variables['x-hasura-user-id'];
    const result = await this.authService.enable2FA(userId);

    return result;
  }

  @Post('verify-2fa-token')
  async verify2FAToken(@Body() body: HasuraActionsPayload<{ token: string }>) {
    const { token } = body.input;
    const userId = body.session_variables['x-hasura-user-id'];
    const success = await this.authService.verify2FAToken(userId, token);

    return { success };
  }

  // @Post('2fa-tool')
  // async twoFaTool(@Body() body: HasuraActionsPayload<{ twoFaKey: string }>) {
  //   const { twoFaKey } = body.input;
  //   const userId = body.session_variables['x-hasura-user-id'];
  //   const success = await this.authService.tool2fa(userId, twoFaKey);
  //   return { success };
  // }

  // ... existing code ...

  @Post('operator/login')
  async operatorLogin(
    @Body()
    payload: HasuraActionsPayloadObject<{
      email: string;
      password: string;
    }>,
  ) {
    const { email, password } = payload.input.input;
    const result: LoginResponse = await this.authService.handleOperatorLogin(email, password);
    return result;
  }

  @Post('refresh-token-operator')
  async refreshTokenOperator(@Body() body: HasuraActionsPayload<{ refreshToken: string }>) {
    const { refreshToken } = body.input;
    const result: RefreshTokenResponse = await this.authService.refreshOperator(refreshToken);
    return result;
  }
}

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard {
  private jwtService: JwtService;
  private authService: AuthService;

  constructor(private moduleRef: ModuleRef) {}

  // Lazy-load services để tránh circular dependency
  private async resolveServices() {
    if (!this.jwtService) {
      this.jwtService = this.moduleRef.get(JwtService, { strict: false });
    }
    if (!this.authService) {
      this.authService = this.moduleRef.get(AuthService, { strict: false });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.resolveServices();
    
    const request = context.switchToHttp().getRequest();
    if (request.path === '/auth/upsert-user') {
        return true; // Bỏ qua việc check JWT
    }
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('No authorization token provided!!!');
    }

    try {
      const user = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      
      const userId = user['https://hasura.io/jwt/claims']['X-Hasura-User-Id'];
      const userInfo = await this.authService.getUserInfo(userId);

      if (!userInfo) {
        throw new UnauthorizedException('User not found');
      }

      // Attach the user info to the request
      request.user = userInfo;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authorization token');
    }
  }
} 
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HasuraWebhookGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const hasuraWebhookSecret = request.headers['x-hasura-webhook-secret'];

    // Lấy secret từ environment variables
    const configuredSecret = this.configService.get<string>('HASURA_WEBHOOK_SECRET');

    if (!hasuraWebhookSecret || hasuraWebhookSecret !== configuredSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    return true;
  }
}

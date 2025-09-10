import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class GostWebhookGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-ghost-signature'];
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const [hash, timestamp] = signature.split(', ').reduce((acc, part) => {
      const [key, value] = part.split('=');
      if (key === 'sha256') acc[0] = value;
      if (key === 't') acc[1] = value;
      return acc;
    }, []);

    if (!hash || !timestamp) {
      throw new UnauthorizedException('Invalid signature format');
    }

    const rawBody = request.rawBody;
    const secret = this.configService.get<string>('GOST_WEBHOOK_SECRET');

    const hmac = crypto.createHmac('sha256', secret);
    const computedHash = hmac.update(`${rawBody}${timestamp}`).digest('hex');

    if (hash === computedHash) {
      return true;
    }

    throw new UnauthorizedException('Invalid webhook signature');
  }
}

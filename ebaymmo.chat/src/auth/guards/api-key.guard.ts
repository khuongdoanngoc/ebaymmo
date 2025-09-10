import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    private readonly API_KEY = process.env.API_KEY;

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const apiKey = request.header('x-api-key');

        if (!apiKey) {
            throw new UnauthorizedException('API key is missing');
        }

        if (apiKey !== this.API_KEY) {
            throw new UnauthorizedException('Invalid API key');
        }

        return true;
    }
}

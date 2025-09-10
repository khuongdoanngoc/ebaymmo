import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    try {
      const { key } = JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET);
      const payload = this.jwtService.verify(token, {
        secret: key,
      });
      request['user'] = payload['https://hasura.io/jwt/claims'];

      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      throw new BadRequestException(error.message);
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

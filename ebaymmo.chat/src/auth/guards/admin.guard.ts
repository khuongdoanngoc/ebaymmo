import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Unauthorized access - User not authenticated');
    }

    if (user.role !== 'admin') {
      throw new ForbiddenException('Admin role required for this operation');
    }

    return true;
  }
} 
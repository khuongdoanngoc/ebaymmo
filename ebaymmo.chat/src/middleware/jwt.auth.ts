import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard {
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        // const token = request.headers.authorization.split(' ')[1];
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // if (!token) {
        //     throw new UnauthorizedException();
        // }

        // // Attach the decoded user information to the request object
        // request.username = decoded['https://hasura.io/jwt/claims']['X-Hasura-User-Id'];

        request.username = 'khuongdoan';
        return true;
    }
}

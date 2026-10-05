import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';
import type { CurrentUserDto } from '../types/current-user.type';

// Reads the user that AuthGuard attached to the request. Throws instead of returning
// undefined so a route that forgot @UseGuards(AuthGuard) fails with 401, not an empty 200.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserDto => {
    const { currentUser } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!currentUser) throw new UnauthorizedException('Authentication is required');

    return currentUser;
  },
);

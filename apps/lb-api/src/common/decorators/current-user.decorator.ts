import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import type { AuthenticatedRequest, CurrentUserDto } from '../types/current-user.type';

export const AUTHENTICATION_REQUIRED_MESSAGE = 'Authentication is required';

// Reads the user that AuthGuard attached to the request. Throws instead of returning
// undefined so a route that forgot @UseGuards(AuthGuard) fails with 401, not an empty 200.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserDto => {
    const { currentUser } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!currentUser) throw new UnauthorizedException(AUTHENTICATION_REQUIRED_MESSAGE);

    return currentUser;
  },
);

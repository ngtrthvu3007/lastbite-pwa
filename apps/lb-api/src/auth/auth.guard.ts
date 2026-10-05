import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { getSessionToken } from './session/auth.cookie';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from '../common';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = getSessionToken(request.headers.cookie);
    const user = token ? await this.auth.getCurrentUserService(token) : null;

    if (!user) throw new UnauthorizedException('Authentication is required');

    request.currentUser = user;
    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { SESSION_ROTATE_BELOW_MS } from './auth.constants';
import { getSessionToken, setSessionCookie } from './session/auth.cookie';
import { AuthService } from './auth.service';
import { AUTHENTICATION_REQUIRED_MESSAGE, type AuthenticatedRequest } from '../common';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const token = getSessionToken(request.headers.cookie);
    const session = token ? await this.auth.getActiveSessionService(token) : null;

    if (!token || !session) throw new UnauthorizedException(AUTHENTICATION_REQUIRED_MESSAGE);

    request.currentUser = session.user;

    // Swap a nearly expired session for a fresh one so the user is never signed out mid-use.
    // A failed swap only costs this renewal, so it must not fail a request that is already authenticated.
    if (session.expiresAt.getTime() - Date.now() < SESSION_ROTATE_BELOW_MS) {
      try {
        const rotated = await this.auth.rotateSessionService(token);

        if (rotated) {
          setSessionCookie(http.getResponse<Response>(), rotated.token, rotated.expiresAt);
        }
      } catch (error) {
        this.logger.warn('Session rotation failed', error);
      }
    }

    return true;
  }
}

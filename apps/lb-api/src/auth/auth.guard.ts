import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { getSessionToken } from './auth.cookie';
import { CurrentUserDto } from './dto/current-user.dto';
import { AuthService } from './auth.service';

export interface AuthenticatedRequest extends Request {
  currentUser?: CurrentUserDto;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.auth.getCurrentUser(getSessionToken(request.headers.cookie));

    if (!user) {
      throw new UnauthorizedException('Authentication is required');
    }

    request.currentUser = user;
    return true;
  }
}

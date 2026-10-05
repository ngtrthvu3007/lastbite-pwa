import type { Request } from 'express';
import type { CurrentUserDto } from './current-user.type';

export interface AuthenticatedRequest extends Request {
  currentUser?: CurrentUserDto;
}

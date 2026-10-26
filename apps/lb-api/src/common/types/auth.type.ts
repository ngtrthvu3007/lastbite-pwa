import type { CurrentUserDto } from './current-user.type';

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

export interface ActiveSession {
  user: CurrentUserDto;
  expiresAt: Date;
}

export interface UserProfile {
  cognitoSub: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CompletedLogin extends CreatedSession {
  returnTo: string;
}

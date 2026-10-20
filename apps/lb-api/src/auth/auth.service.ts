import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthSessionService, CreatedSession } from './session/auth-session.service';
import { CognitoOAuthService } from './oauth/cognito-oauth.service';
import { CurrentUserDto } from '../common';
import { OAuthTransactionService } from './oauth/oauth-transaction.service';
import { UserService } from './user.service';

interface CompletedLogin extends CreatedSession {
  returnTo: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly oauthTransactions: OAuthTransactionService,
    private readonly cognitoOAuth: CognitoOAuthService,
    private readonly users: UserService,
    private readonly authSessions: AuthSessionService,
  ) {}

  async beginLoginService(returnTo?: string) {
    return this.oauthTransactions.beginTransactionService(returnTo);
  }

  async completeLoginService(
    code: string | undefined,
    state: string,
    oauthError: string | undefined,
  ): Promise<CompletedLogin> {
    const transaction = await this.oauthTransactions.consumeTransactionService(state);

    if (oauthError) {
      throw new BadRequestException(`OAuth login failed: ${oauthError}`);
    }

    const profile = await this.cognitoOAuth.exchangeCodeService(code, transaction.nonce);
    const userId = await this.users.syncUserService(profile);
    const session = await this.authSessions.createSessionService(userId);

    return { ...session, returnTo: transaction.returnTo };
  }

  async getCurrentUserService(token: string): Promise<CurrentUserDto | null> {
    return this.authSessions.getCurrentUserService(token);
  }

  async logoutService(token: string) {
    await this.authSessions.revokeSessionService(token);
  }
}

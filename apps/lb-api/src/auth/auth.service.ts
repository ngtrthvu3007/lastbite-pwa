import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthSessionService } from './session/auth-session.service';
import { CognitoOAuthService } from './oauth/cognito-oauth.service';
import type { ActiveSession, CreatedSession, CompletedLogin } from '../common';
import { OAuthTransactionService } from './oauth/oauth-transaction.service';
import { UserService } from './user.service';

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

  async getActiveSessionService(token: string): Promise<ActiveSession | null> {
    return this.authSessions.getActiveSessionService(token);
  }

  async rotateSessionService(token: string): Promise<CreatedSession | null> {
    return this.authSessions.rotateSessionService(token);
  }

  async logoutService(token: string) {
    await this.authSessions.revokeSessionService(token);
  }
}

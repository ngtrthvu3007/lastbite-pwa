import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthSessionService, CreatedSession } from './session/auth-session.service';
import { CognitoOAuthService } from './cognito/cognito-oauth.service';
import { CognitoUserService } from './cognito/cognito-user.service';
import { AuthApp } from './dto/auth-login-query.dto';
import { CurrentUserDto } from '../common';
import { OAuthTransactionService } from './oauth/oauth-transaction.service';

interface CompletedLogin extends CreatedSession {
  returnTo: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly oauthTransactions: OAuthTransactionService,
    private readonly cognitoOAuth: CognitoOAuthService,
    private readonly cognitoUsers: CognitoUserService,
    private readonly authSessions: AuthSessionService,
  ) {}

  async beginLoginService(app: AuthApp, returnTo = '') {
    return this.oauthTransactions.beginTransactionService(app, returnTo);
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

    const login = await this.cognitoOAuth.exchangeCodeService(code, transaction.nonce);
    const userId = await this.cognitoUsers.syncUserService(login.profile);
    const session = await this.authSessions.createSessionService(userId, login.refreshToken);

    return { ...session, returnTo: transaction.returnTo };
  }

  async getCurrentUserService(token: string): Promise<CurrentUserDto | null> {
    return this.authSessions.getCurrentUserService(token);
  }

  async logoutService(token: string) {
    await this.authSessions.revokeSessionService(token);
  }
}
